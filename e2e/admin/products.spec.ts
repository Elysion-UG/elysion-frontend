/**
 * Admin – Products (Read-only Liste)
 *
 * Mutating Toggles auf Detail-Seite: product-detail.spec.ts.
 */
import { test, expect } from "@playwright/test"
import { AdminProductsPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

test.describe("Admin – Produktliste", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Liste zeigt Heading und Tabelle", async ({ page }) => {
    const products = new AdminProductsPage(page)
    await products.goto()

    await expect(products.title).toBeVisible({ timeout: 10_000 })
    await expect(products.table.or(products.emptyMessage)).toBeVisible({ timeout: 10_000 })
  })

  test("Suche akzeptiert Eingabe", async ({ page }) => {
    const products = new AdminProductsPage(page)
    await products.goto()
    await expect(products.title).toBeVisible({ timeout: 10_000 })

    await products.searchInput.fill("Shirt")
    await expect(products.searchInput).toHaveValue("Shirt")
  })

  test("Status-Filter ACTIVE bleibt sichtbar nach Auswahl", async ({ page }) => {
    const products = new AdminProductsPage(page)
    await products.goto()
    await expect(products.title).toBeVisible({ timeout: 10_000 })

    await products.statusFilter.selectOption("ACTIVE")
    await expect(products.statusFilter).toHaveValue("ACTIVE")
    await expect(products.table.or(products.emptyMessage)).toBeVisible({ timeout: 10_000 })

    await products.statusFilter.selectOption("")
  })

  test("Refresh-Button lädt die Tabelle neu", async ({ page }) => {
    const products = new AdminProductsPage(page)
    await products.goto()
    await expect(products.title).toBeVisible({ timeout: 10_000 })

    await products.refreshButton.click()
    await expect(products.table.or(products.emptyMessage)).toBeVisible({ timeout: 10_000 })
  })

  test("'Im Shop ansehen' Inline-Link hat target=_blank", async ({ page }) => {
    const products = new AdminProductsPage(page)
    await products.goto()
    await expect(products.title).toBeVisible({ timeout: 10_000 })

    const rowCount = await products.rows.count()
    test.skip(rowCount === 0, "Keine Produkte — Test übersprungen.")

    // ExternalLink-Icon-Link in der Zeile öffnet Shop
    const shopLink = products.rows.first().locator('a[href^="/product?slug="]').first()
    await expect(shopLink).toHaveAttribute("target", "_blank")
    await expect(shopLink).toHaveAttribute("href", /\/product\?slug=.+/)
  })

  test("Klick auf erste Zeile öffnet Produkt-Detail", async ({ page }) => {
    const products = new AdminProductsPage(page)
    await products.goto()
    await expect(products.title).toBeVisible({ timeout: 10_000 })

    const rowCount = await products.rows.count()
    test.skip(rowCount === 0, "Keine Produkte — Test übersprungen.")

    await products.clickFirstRow()
    await expect(page).toHaveURL(/\/admin\/products\/[a-f0-9-]+/i, { timeout: 10_000 })
  })
})
