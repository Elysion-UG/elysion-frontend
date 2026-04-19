import { test, expect } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

// baseURL=http://seller.localhost:3000 + storageState (Refresh-Cookie) kommen aus playwright.config.ts

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SELLER_AUTH_FILE = path.join(__dirname, "..", ".auth", "seller.json")

// Seed-Produkte von GreenThread Textiles GmbH (seller1@greenthread.dev)
const EXPECTED_PRODUCTS = ["Bio-Baumwoll T-Shirt", "Fair-Trade Pullover", "Leinen-Shorts"]

// Serial mode: der Refresh-Token ist single-use. Jeder Test lädt storageState,
// rotiert den Cookie bei Phase-2-Refresh, und muss den neuen Cookie zurück ins
// File schreiben — sonst lädt der nächste Test den bereits invalidierten Token.
test.describe.configure({ mode: "serial" })

test.describe("Seller – Produkte", () => {
  test.beforeEach(async ({ page }) => {
    // Kein Login nötig — Refresh-Cookie aus storageState holt frisches Access-Token
    await page.goto("/seller-dashboard")
    // Warte bis AuthContext geladen hat (Phase 2: Refresh-Cookie → Access-Token)
    await expect(page.getByRole("heading", { name: "Produkte", exact: true })).toBeVisible({
      timeout: 10_000,
    })
  })

  // Speichert den rotierten Refresh-Cookie zurück, damit der nächste Test
  // nicht den bereits invalidierten Token aus der Datei liest.
  test.afterEach(async ({ page }) => {
    await page.context().storageState({ path: SELLER_AUTH_FILE })
  })

  test("Produkte-Tab zeigt Tabelle nach Login", async ({ page }) => {
    const table = page.getByRole("table")
    await expect(table).toBeVisible({ timeout: 8_000 })
  })

  test("Alle drei Seed-Produkte sind in der Liste", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible({ timeout: 8_000 })

    for (const productName of EXPECTED_PRODUCTS) {
      await expect(page.getByText(productName)).toBeVisible()
    }
  })

  test("Aktive Produkte haben Status-Badge 'Aktiv'", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible({ timeout: 8_000 })

    const rows = page.getByRole("row")

    const tshirtRow = rows.filter({ hasText: "Bio-Baumwoll T-Shirt" })
    await expect(tshirtRow.getByText("Aktiv")).toBeVisible()

    const pulloverRow = rows.filter({ hasText: "Fair-Trade Pullover" })
    await expect(pulloverRow.getByText("Aktiv")).toBeVisible()
  })

  test("Leinen-Shorts hat Status 'Entwurf'", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible({ timeout: 8_000 })

    const shortsRow = page.getByRole("row").filter({ hasText: "Leinen-Shorts" })
    await expect(shortsRow.getByText("Entwurf")).toBeVisible()
  })

  test("Produkte-Tab ist über URL-Navigation erreichbar", async ({ page }) => {
    await page.goto("/seller-dashboard?tab=orders")
    await expect(page.getByRole("heading", { name: "Bestellungen", exact: true })).toBeVisible({
      timeout: 8_000,
    })

    await page.goto("/seller-dashboard?tab=products")
    await expect(page.getByRole("heading", { name: "Produkte", exact: true })).toBeVisible()
    await expect(page.getByRole("table")).toBeVisible({ timeout: 8_000 })
  })
})
