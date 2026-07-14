import { test, expect } from "@playwright/test"
import { CartPage } from "../pages"

/**
 * Gast-Warenkorb (#81) — /cart ist ohne Login einsehbar.
 *
 * Läuft im `chromium`-Projekt OHNE storageState (unauthentifiziert). Vor dem
 * Fix hing die gesamte (buyer)-Gruppe inkl. /cart hinter dem AuthGuard, sodass
 * ein Gast nur „Anmeldung erforderlich" sah. Jetzt liegt /cart in der
 * (public)-Gruppe: Der Warenkorb rendert, Checkout bleibt login-pflichtig.
 */

test.describe("Gast – Warenkorb (#81)", () => {
  test("/cart ist ohne Login einsehbar und zeigt nicht die Login-Wand", async ({ page }) => {
    const cart = new CartPage(page)
    await cart.goto()

    // Bleibt auf /cart (kein Redirect auf / oder eine Login-Route).
    await expect(page).toHaveURL(/\/cart$/)

    // Die AuthGuard-Wand darf NICHT erscheinen.
    await expect(page.getByRole("heading", { name: "Anmeldung erforderlich" })).toBeHidden()

    // Der Warenkorb rendert — für den leeren Gast-Cart die Leerzustands-Ansicht.
    await expect(cart.emptyHeading).toBeVisible({ timeout: 10_000 })
  })
})
