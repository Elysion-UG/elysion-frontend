import { test, expect } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"
import { ShopHomePage, ProductDetailPage, CheckoutPage } from "../pages"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BUYER_AUTH_FILE = path.join(__dirname, "..", ".auth", "buyer.json")

// Serieller Modus: Refresh-Cookie aus storageState ist single-use. Jeder Test
// schreibt den rotierten Cookie zurück, bevor der nächste läuft (vgl. checkout.spec.ts).
test.describe.configure({ mode: "serial" })

/**
 * Stripe-Payment Happy-Path (Issue #12).
 *
 * Voraussetzungen:
 *  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test_…) ist gesetzt — sonst rendert
 *    PaymentStep nur „Zahlungssystem nicht konfiguriert“.
 *  - Backend mit gültigem Stripe-Secret-Key + Webhook (BE#108), damit
 *    `create-intent` einen clientSecret liefert und die Zahlung bestätigt wird.
 *  - Seed-Buyer `buyer2@example.dev` mit mindestens einer gespeicherten Adresse.
 *
 * Der Test ist self-contained: er legt selbst einen Artikel in den Warenkorb,
 * da der `complete`-Step den Warenkorb leert.
 */
test.describe("Buyer – Stripe Checkout Happy-Path", () => {
  test.afterEach(async ({ page }) => {
    await page.context().storageState({ path: BUYER_AUTH_FILE })
  })

  test("Artikel kaufen: Shop → Warenkorb → Checkout → Stripe-Testkarte → Bestellung", async ({
    page,
  }) => {
    // 1) Artikel in den Warenkorb legen (Warenkorb self-contained befüllen)
    const shop = new ShopHomePage(page)
    await shop.open()
    await shop.openFirstProduct()

    const product = new ProductDetailPage(page)
    await product.addToCart()

    // 2) Checkout: Adresse → Übersicht
    const checkout = new CheckoutPage(page)
    await checkout.goto()
    await expect(checkout.loginRequiredHeading).toHaveCount(0)
    await expect(checkout.addressHeading).toBeVisible({ timeout: 10_000 })
    await checkout.selectAddressAndContinue()

    // 3) AGB akzeptieren → kostenpflichtig bestellen → Payment-Step
    await expect(checkout.previewHeading).toBeVisible()
    await checkout.acceptTermsAndPlaceOrder()

    // 4) Stripe-Testkarte ausfüllen und bezahlen
    await expect(checkout.paymentHeading).toBeVisible({ timeout: 20_000 })
    await checkout.fillStripeTestCard()
    await checkout.pay()

    // 5) Erfolgsbestätigung
    await expect(checkout.successHeading).toBeVisible({ timeout: 30_000 })
  })
})
