import { test, expect } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"
import { OrdersPage } from "../pages"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BUYER_AUTH_FILE = path.join(__dirname, "..", ".auth", "buyer.json")

test.describe.configure({ mode: "serial" })

test.describe("Buyer – Bestellungen", () => {
  test.afterEach(async ({ page }) => {
    await page.context().storageState({ path: BUYER_AUTH_FILE })
  })

  test("Bestellungen-Seite ist erreichbar", async ({ page }) => {
    const orders = new OrdersPage(page)
    await orders.goto()

    // Entweder Liste oder Empty-State — beides valide.
    await expect(orders.title.or(orders.emptyHeading)).toBeVisible({ timeout: 10_000 })
  })
})
