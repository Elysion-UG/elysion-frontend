/**
 * Admin – Seller Detail
 *
 * Read-only Render + Mutating: APPROVED ↔ SUSPENDED Toggle.
 * Wir wählen seller1@greenthread.dev (APPROVED in Seed-Daten).
 *
 * Reject-Cancel für PENDING-Seller wird in sellers.spec.ts getestet.
 */
import { test, expect, type Page } from "@playwright/test"
import { AdminSellersPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

const SELLER_COMPANY = "GreenThread"

test.describe.configure({ mode: "serial" })

async function openSellerDetail(page: Page, companyHint: string): Promise<void> {
  const sellers = new AdminSellersPage(page)
  await sellers.goto()
  await expect(sellers.title).toBeVisible({ timeout: 10_000 })

  const row = page.locator("tbody tr").filter({ hasText: companyHint }).first()
  await expect(row).toBeVisible({ timeout: 10_000 })
  await row.click()
  await expect(page).toHaveURL(/\/admin\/sellers\/[a-f0-9-]+/i, { timeout: 10_000 })
}

test.describe("Admin – Seller Detail (Read-only)", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Detail-Seite rendert mit Seller-Info und Produkte-Liste", async ({ page }) => {
    await openSellerDetail(page, SELLER_COMPANY)

    await expect(page.getByRole("heading", { name: new RegExp(SELLER_COMPANY) })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/^Produkte \(\d+\)$/)).toBeVisible({ timeout: 10_000 })
  })

  test("Back-Button kehrt zur Seller-Liste zurück", async ({ page }) => {
    await openSellerDetail(page, SELLER_COMPANY)

    await page
      .getByRole("button", { name: /Zurück/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/admin\/sellers(\?|$)/, { timeout: 10_000 })
  })

  test("Produkt-Detail-Link funktioniert", async ({ page }) => {
    await openSellerDetail(page, SELLER_COMPANY)

    const detailsLink = page.getByRole("link", { name: /Details →/i }).first()
    const linkCount = await detailsLink.count()
    test.skip(linkCount === 0, "Seller hat keine Produkte — Test übersprungen.")

    await detailsLink.click()
    await expect(page).toHaveURL(/\/admin\/products\/[a-f0-9-]+/i, { timeout: 10_000 })
  })
})

test.describe("Admin – Seller Detail (Sperren-Toggle, mit Cleanup)", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("APPROVED → SUSPENDED → APPROVED ist idempotent", async ({ page }) => {
    await openSellerDetail(page, SELLER_COMPANY)

    const suspendButton = page.getByRole("button", { name: "Sperren", exact: true })
    const isApproved = await suspendButton.isVisible().catch(() => false)
    test.skip(!isApproved, `${SELLER_COMPANY} ist nicht APPROVED — Toggle-Test übersprungen.`)

    await test.step("Sperren-Inline-Reason aufklappen", async () => {
      await suspendButton.click()
      await expect(page.getByPlaceholder(/Sperrgrund/i)).toBeVisible({ timeout: 5_000 })
    })

    await test.step("Reason eingeben und bestätigen", async () => {
      await page.getByPlaceholder(/Sperrgrund/i).fill("E2E Test — wird gleich zurückgesetzt")
      await page.getByRole("button", { name: "Bestätigen" }).click()
      // Status wechselt zu Gesperrt → Sperren-Button verschwindet
      await expect(suspendButton).not.toBeVisible({ timeout: 10_000 })
    })

    await test.step("Cleanup: zurück über Liste auf Genehmigen klicken", async () => {
      // Auf Detail-Seite gibt es bei SUSPENDED keine Approve-Action — wir
      // navigieren in die Liste, filtern nach SUSPENDED und klicken Inline-
      // Approve (Entsperren-Icon).
      await page.goto("/admin/sellers")
      const statusFilter = page.locator("select").filter({ hasText: "Alle Status" }).first()
      await statusFilter.selectOption("SUSPENDED")
      const row = page.locator("tbody tr").filter({ hasText: SELLER_COMPANY }).first()
      await expect(row).toBeVisible({ timeout: 10_000 })
      // "Entsperren" ist der title des SUSPENDED-Action-Buttons (CheckCircle2)
      await row.getByRole("button", { name: "Entsperren" }).click()
      // Row verschwindet aus dem SUSPENDED-Filter
      await expect(row).not.toBeVisible({ timeout: 10_000 })
    })
  })
})
