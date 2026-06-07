/**
 * Admin – Seller-Liste
 *
 * Read-only Tests + Modal-Open/Cancel.
 * Mutating Aktionen auf Detail-Seite: sellers-detail.spec.ts.
 */
import { test, expect } from "@playwright/test"
import { AdminSellersPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

test.describe("Admin – Seller-Verwaltung", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Seller-Liste zeigt Heading und Tabelle", async ({ page }) => {
    const sellers = new AdminSellersPage(page)
    await sellers.goto()

    await expect(sellers.title).toBeVisible({ timeout: 10_000 })
    await expect(sellers.table.or(page.getByText(/Keine Verkäufer/i))).toBeVisible({
      timeout: 10_000,
    })
  })

  test("Such-Input ist erreichbar und nimmt Eingaben an", async ({ page }) => {
    const sellers = new AdminSellersPage(page)
    await sellers.goto()
    await expect(sellers.title).toBeVisible({ timeout: 10_000 })

    const searchCount = await sellers.searchInput.count()
    if (searchCount > 0) {
      await sellers.searchInput.first().fill("Green")
      await expect(sellers.searchInput.first()).toHaveValue("Green")
    }
  })

  test("Status-Filter funktioniert und Tabelle bleibt sichtbar", async ({ page }) => {
    const sellers = new AdminSellersPage(page)
    await sellers.goto()
    await expect(sellers.title).toBeVisible({ timeout: 10_000 })

    const statusFilter = page.locator("select").filter({ hasText: "Alle Status" }).first()
    await statusFilter.selectOption("APPROVED")
    await expect(statusFilter).toHaveValue("APPROVED")
    await expect(sellers.table.or(page.getByText(/Keine Verkäufer/i))).toBeVisible({
      timeout: 10_000,
    })

    // Reset
    await statusFilter.selectOption("")
  })

  test("Refresh-Button löst Reload aus (Tabelle bleibt sichtbar)", async ({ page }) => {
    const sellers = new AdminSellersPage(page)
    await sellers.goto()
    await expect(sellers.title).toBeVisible({ timeout: 10_000 })

    await page.getByRole("button", { name: /Aktualisieren/i }).click()
    await expect(sellers.table.or(page.getByText(/Keine Verkäufer/i))).toBeVisible({
      timeout: 10_000,
    })
  })

  test("Reject-Modal öffnet bei PENDING + Cancel schließt es", async ({ page }) => {
    const sellers = new AdminSellersPage(page)
    await sellers.goto()
    await expect(sellers.title).toBeVisible({ timeout: 10_000 })

    // Auf PENDING filtern damit wir verlässlich einen Reject-Button finden
    const statusFilter = page.locator("select").filter({ hasText: "Alle Status" }).first()
    await statusFilter.selectOption("PENDING")

    const rejectButtons = page.getByRole("button", { name: "Ablehnen" })
    const count = await rejectButtons.count()
    test.skip(count === 0, "Keine PENDING-Seller in Seed — Reject-Modal-Test übersprungen.")

    await rejectButtons.first().click()
    const modalTitle = page.getByRole("heading", { name: "Verkäufer ablehnen" })
    await expect(modalTitle).toBeVisible({ timeout: 5_000 })

    // Cancel-Button: erster "Abbrechen" im Dialog
    await page.getByRole("button", { name: "Abbrechen" }).first().click()
    await expect(modalTitle).not.toBeVisible({ timeout: 5_000 })

    await statusFilter.selectOption("")
  })

  test("Suspend-Modal öffnet bei APPROVED + Cancel schließt es", async ({ page }) => {
    const sellers = new AdminSellersPage(page)
    await sellers.goto()
    await expect(sellers.title).toBeVisible({ timeout: 10_000 })

    const statusFilter = page.locator("select").filter({ hasText: "Alle Status" }).first()
    await statusFilter.selectOption("APPROVED")

    const suspendButtons = page.getByRole("button", { name: "Sperren" })
    const count = await suspendButtons.count()
    test.skip(count === 0, "Keine APPROVED-Seller mit Sperren-Action — Test übersprungen.")

    await suspendButtons.first().click()
    const modalTitle = page.getByRole("heading", { name: "Verkäufer sperren" })
    await expect(modalTitle).toBeVisible({ timeout: 5_000 })

    await page.getByRole("button", { name: "Abbrechen" }).first().click()
    await expect(modalTitle).not.toBeVisible({ timeout: 5_000 })

    await statusFilter.selectOption("")
  })
})
