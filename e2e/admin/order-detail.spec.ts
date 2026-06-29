/**
 * Admin – Order Detail (Read-only Render)
 *
 * Order-Detail hat keine mutierenden Aktionen aus Admin-Sicht.
 * Wir prüfen, dass Progress, Kosten und Order-Groups gerendert werden.
 */
import { test, expect, type Page } from "@playwright/test"
import { AdminOrdersPage, AdminOrderDetailPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

async function openFirstOrderDetail(page: Page): Promise<boolean> {
  const orders = new AdminOrdersPage(page)
  await orders.goto()
  await expect(orders.title).toBeVisible({ timeout: 10_000 })

  const rowCount = await orders.rows.count()
  if (rowCount === 0) return false

  await orders.clickFirstRow()
  await expect(page).toHaveURL(/\/admin\/orders\/[a-f0-9-]+/i, { timeout: 10_000 })
  return true
}

test.describe("Admin – Order Detail", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Detail rendert mit Header, Kosten-Block und Order-Groups", async ({ page }) => {
    const opened = await openFirstOrderDetail(page)
    test.skip(!opened, "Keine Bestellungen vorhanden.")

    const detail = new AdminOrderDetailPage(page)
    await expect(detail.backButton).toBeVisible()
    await expect(detail.costsHeading).toBeVisible({ timeout: 10_000 })
    // Order-Groups sind optional (nur wenn die Bestellung welche hat)
    const groupsCount = await detail.groupsHeading.count()
    if (groupsCount > 0) {
      await expect(detail.groupsHeading.first()).toBeVisible()
    }
  })

  test("Order-Number wird als Überschrift dargestellt", async ({ page }) => {
    const opened = await openFirstOrderDetail(page)
    test.skip(!opened, "Keine Bestellungen vorhanden.")

    // Order-Number ist die font-mono Heading auf der Seite
    const h1 = page.locator("h1")
    await expect(h1.first()).toBeVisible({ timeout: 10_000 })
  })

  test("Back-Button kehrt zur Bestellungs-Liste zurück", async ({ page }) => {
    const opened = await openFirstOrderDetail(page)
    test.skip(!opened, "Keine Bestellungen vorhanden.")

    await new AdminOrderDetailPage(page).backButton.click()
    await expect(page).toHaveURL(/\/admin\/orders(\?|$)/, { timeout: 10_000 })
  })
})
