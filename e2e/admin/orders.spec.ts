/**
 * Admin – Orders (Read-only Liste)
 *
 * Detail-Render in order-detail.spec.ts.
 */
import { test, expect } from "@playwright/test"
import { AdminOrdersPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

test.describe("Admin – Bestellungs-Liste", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Liste zeigt Heading und Tabelle", async ({ page }) => {
    const orders = new AdminOrdersPage(page)
    await orders.goto()

    await expect(orders.title).toBeVisible({ timeout: 10_000 })
    await expect(orders.table.or(orders.emptyMessage)).toBeVisible({ timeout: 10_000 })
  })

  test("Suche akzeptiert Eingabe", async ({ page }) => {
    const orders = new AdminOrdersPage(page)
    await orders.goto()
    await expect(orders.title).toBeVisible({ timeout: 10_000 })

    await orders.searchInput.fill("ORDER-")
    await expect(orders.searchInput).toHaveValue("ORDER-")
  })

  test("Status-Filter PAID setzt Query und Tabelle bleibt sichtbar", async ({ page }) => {
    const orders = new AdminOrdersPage(page)
    await orders.goto()
    await expect(orders.title).toBeVisible({ timeout: 10_000 })

    await orders.statusFilter.selectOption("PAID")
    await expect(orders.statusFilter).toHaveValue("PAID")
    await expect(orders.table.or(orders.emptyMessage)).toBeVisible({ timeout: 10_000 })

    await orders.statusFilter.selectOption("")
  })

  test("Refresh-Button lädt Tabelle neu", async ({ page }) => {
    const orders = new AdminOrdersPage(page)
    await orders.goto()
    await expect(orders.title).toBeVisible({ timeout: 10_000 })

    await orders.refreshButton.click()
    await expect(orders.table.or(orders.emptyMessage)).toBeVisible({ timeout: 10_000 })
  })

  test("Klick auf erste Zeile öffnet Order-Detail", async ({ page }) => {
    const orders = new AdminOrdersPage(page)
    await orders.goto()
    await expect(orders.title).toBeVisible({ timeout: 10_000 })

    const rowCount = await orders.rows.count()
    test.skip(rowCount === 0, "Keine Bestellungen vorhanden.")

    await orders.clickFirstRow()
    await expect(page).toHaveURL(/\/admin\/orders\/[a-f0-9-]+/i, { timeout: 10_000 })
  })
})
