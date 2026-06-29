import type { Page, Locator, FrameLocator } from "@playwright/test"
import { BasePage } from "./BasePage"

/**
 * Checkout-Flow über alle vier Schritte:
 *   address → preview → payment (Stripe Elements) → success
 *
 * Die Payment-Helfer interagieren mit dem in einen iframe eingebetteten
 * Stripe PaymentElement. Voraussetzung für den vollen Happy-Path: das Backend
 * hat einen gültigen Stripe-Secret-Key konfiguriert (BE#108), sonst schlägt
 * `createIntent` / `confirmPayment` fehl.
 */
export class CheckoutPage extends BasePage {
  // ── Schritt 1: Adresse ──────────────────────────────────────────────
  readonly addressHeading: Locator
  readonly loginRequiredHeading: Locator
  readonly continueToPreviewButton: Locator
  readonly addressRadios: Locator

  // ── Schritt 2: Übersicht ────────────────────────────────────────────
  readonly previewHeading: Locator
  readonly termsCheckbox: Locator
  readonly placeOrderButton: Locator

  // ── Schritt 3: Zahlung (Stripe) ─────────────────────────────────────
  readonly paymentHeading: Locator
  readonly payButton: Locator

  // ── Schritt 4: Erfolg ───────────────────────────────────────────────
  readonly successHeading: Locator

  constructor(page: Page) {
    super(page)
    this.addressHeading = page.getByRole("heading", { name: /Lieferadresse/i })
    this.loginRequiredHeading = page.getByRole("heading", { name: /Anmeldung erforderlich/i })
    this.continueToPreviewButton = page.getByRole("button", { name: /Weiter zur Übersicht/i })
    this.addressRadios = page.locator('input[name="address"]')

    this.previewHeading = page.getByRole("heading", { name: /Bestellung bestätigen/i })
    this.termsCheckbox = page.getByRole("checkbox")
    this.placeOrderButton = page.getByRole("button", { name: /Zahlungspflichtig bestellen/i })

    this.paymentHeading = page.getByRole("heading", { name: "Zahlung", exact: true })
    this.payButton = page.getByRole("button", { name: /Jetzt bezahlen/i })

    this.successHeading = page.getByRole("heading", { name: /Bestellung aufgegeben/i })
  }

  async goto() {
    await this.page.goto("/checkout")
  }

  /** Wählt die erste Adresse (falls keine vorausgewählt ist) und geht zur Übersicht. */
  async selectAddressAndContinue(): Promise<void> {
    if (await this.addressRadios.count()) {
      await this.addressRadios.first().check()
    }
    await this.continueToPreviewButton.click()
    await this.previewHeading.waitFor({ state: "visible", timeout: 15_000 })
  }

  /** Akzeptiert AGB/Widerruf und legt die kostenpflichtige Bestellung an (→ Payment). */
  async acceptTermsAndPlaceOrder(): Promise<void> {
    await this.termsCheckbox.check()
    await this.placeOrderButton.click()
    await this.paymentHeading.waitFor({ state: "visible", timeout: 20_000 })
  }

  /** Liefert den FrameLocator des Stripe PaymentElement (eingebetteter iframe). */
  private stripeFrame(): FrameLocator {
    return this.page.frameLocator(
      'iframe[title*="payment" i], iframe[name^="__privateStripeFrame"]'
    )
  }

  /**
   * Füllt die Stripe-Testkarte (4242 4242 4242 4242). Die Eingabefelder im
   * PaymentElement haben stabile `name`-Attribute (number/expiry/cvc); ein
   * optionales Postleitzahl-Feld wird nur befüllt, wenn es erscheint.
   */
  async fillStripeTestCard(): Promise<void> {
    const frame = this.stripeFrame()
    const number = frame.locator('[name="number"]')
    await number.waitFor({ state: "visible", timeout: 20_000 })
    await number.fill("4242424242424242")
    await frame.locator('[name="expiry"]').fill("12 / 34")
    await frame.locator('[name="cvc"]').fill("123")

    const postal = frame.locator('[name="postalCode"]')
    if (await postal.count()) {
      await postal.fill("10115")
    }
  }

  /** Löst die Zahlung aus und wartet auf den Success-Step. */
  async pay(): Promise<void> {
    await this.payButton.click()
    await this.successHeading.waitFor({ state: "visible", timeout: 30_000 })
  }
}
