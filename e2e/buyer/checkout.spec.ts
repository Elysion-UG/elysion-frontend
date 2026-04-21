import { test, expect } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"
import { CartPage, CheckoutPage } from "../pages"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BUYER_AUTH_FILE = path.join(__dirname, "..", ".auth", "buyer.json")

// Serieller Modus: Refresh-Cookie aus storageState ist single-use. Jeder Test
// schreibt den rotierten Cookie zurück, bevor der nächste läuft.
test.describe.configure({ mode: "serial" })

test.describe("Buyer – Cart & Checkout", () => {
  test.afterEach(async ({ page }) => {
    await page.context().storageState({ path: BUYER_AUTH_FILE })
  })

  test("Warenkorb-Seite lädt und zeigt Heading oder Leerstate", async ({ page }) => {
    const cart = new CartPage(page)
    await cart.goto()

    // Entweder Warenkorb mit Items oder Empty-State — beides ist ein valider Zustand
    // abhängig von der Seed-Lage (buyer2 sollte Items haben).
    await expect(cart.title.or(cart.emptyHeading)).toBeVisible({ timeout: 10_000 })
  })

  test("Checkout-Seite zeigt Adress-Schritt für eingeloggten Buyer", async ({ page }) => {
    const checkout = new CheckoutPage(page)
    await checkout.goto()

    // LoginRequired darf NICHT erscheinen — wir sind eingeloggt.
    await expect(checkout.loginRequiredHeading).toHaveCount(0)
    await expect(checkout.addressHeading).toBeVisible({ timeout: 10_000 })
  })

  test("Weiter-zur-Übersicht-Button ist im Checkout-Adress-Step vorhanden", async ({ page }) => {
    const checkout = new CheckoutPage(page)
    await checkout.goto()
    await expect(checkout.addressHeading).toBeVisible({ timeout: 10_000 })
    await expect(checkout.continueToPreviewButton).toBeVisible()
  })
})
