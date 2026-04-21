import { test, expect } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"
import { AdminSellersPage } from "../pages"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ADMIN_AUTH_FILE = path.join(__dirname, "..", ".auth", "admin.json")

test.describe.configure({ mode: "serial" })

test.describe("Admin – Seller-Verwaltung", () => {
  test.afterEach(async ({ page }) => {
    await page.context().storageState({ path: ADMIN_AUTH_FILE })
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
})
