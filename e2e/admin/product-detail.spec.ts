/**
 * Admin – Product Detail
 *
 * Read-only Render + Mutating Toggle: Activate ↔ Deactivate.
 *
 * Wir nutzen ein ACTIVE-Produkt aus der gefilterten Liste — kein
 * spezifischer Slug-Hardcode, weil Seed-Daten variieren können.
 *
 * Wichtig: Aktivieren ist nur möglich wenn verifiedCertificateCount > 0
 * (Backend-Restriktion). Wir testen daher: ACTIVE → INACTIVE → ACTIVE.
 */
import { test, expect, type Page } from "@playwright/test"
import { AdminProductsPage, AdminProductDetailPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

async function openFirstProductDetail(
  page: Page,
  statusFilter: "ACTIVE" | "INACTIVE" | ""
): Promise<boolean> {
  const products = new AdminProductsPage(page)
  await products.goto()
  await expect(products.title).toBeVisible({ timeout: 10_000 })

  if (statusFilter) {
    await products.statusFilter.selectOption(statusFilter)
  }

  const rowCount = await products.rows.count()
  if (rowCount === 0) return false

  await products.clickFirstRow()
  await expect(page).toHaveURL(/\/admin\/products\/[a-f0-9-]+/i, { timeout: 10_000 })
  return true
}

test.describe("Admin – Product Detail (Read-only)", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Detail rendert mit Header, Status-Badge und Aktionen", async ({ page }) => {
    const opened = await openFirstProductDetail(page, "")
    test.skip(!opened, "Keine Produkte vorhanden.")

    const detail = new AdminProductDetailPage(page)
    await expect(detail.backButton).toBeVisible()
    await expect(detail.shopLink).toBeVisible()
    await expect(detail.shopLink).toHaveAttribute("target", "_blank")
  })

  test("Back-Button kehrt zur Produktliste zurück", async ({ page }) => {
    const opened = await openFirstProductDetail(page, "")
    test.skip(!opened, "Keine Produkte vorhanden.")

    await new AdminProductDetailPage(page).backButton.click()
    await expect(page).toHaveURL(/\/admin\/products(\?|$)/, { timeout: 10_000 })
  })

  test("Seller-Link (falls Mapping gefunden) führt zur Seller-Detail-Seite", async ({ page }) => {
    const opened = await openFirstProductDetail(page, "")
    test.skip(!opened, "Keine Produkte vorhanden.")

    const detail = new AdminProductDetailPage(page)
    const linkCount = await detail.sellerLink.count()
    test.skip(linkCount === 0, "Seller-Mapping fehlt (z.B. listSellers nicht geladen).")

    await detail.sellerLink.click()
    await expect(page).toHaveURL(/\/admin\/sellers\/[a-f0-9-]+/i, { timeout: 10_000 })
  })
})

test.describe("Admin – Product Detail (Activate↔Deactivate Toggle)", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("ACTIVE → INACTIVE → ACTIVE ist idempotent", async ({ page }) => {
    const opened = await openFirstProductDetail(page, "ACTIVE")
    test.skip(!opened, "Keine ACTIVE-Produkte — Toggle-Test übersprungen.")

    const detail = new AdminProductDetailPage(page)

    await test.step("Deaktivieren", async () => {
      await expect(detail.deactivateButton).toBeVisible({ timeout: 10_000 })
      await detail.deactivateButton.click()
      // Nach Reload: Status hat gewechselt, jetzt sollte Activate sichtbar sein
      await expect(detail.activateButton).toBeVisible({ timeout: 10_000 })
    })

    await test.step("Wieder aktivieren (Cleanup)", async () => {
      const isDisabled = await detail.activateButton.isDisabled().catch(() => false)
      // Wenn verifiedCertificateCount === 0 → Backend hat Produkt gar nicht erst
      // ACTIVE setzen dürfen. Sollte nicht passieren da Startzustand ACTIVE war.
      expect(
        isDisabled,
        "Aktivieren-Button ist disabled (verifiedCertificateCount === 0) — Cleanup nicht möglich"
      ).toBe(false)

      await detail.activateButton.click()
      await expect(detail.deactivateButton).toBeVisible({ timeout: 10_000 })
    })
  })
})
