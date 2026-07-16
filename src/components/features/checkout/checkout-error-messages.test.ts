import { describe, it, expect } from "vitest"

import {
  CHECKOUT_ADDRESS_LOAD_ERROR,
  CHECKOUT_PREVIEW_ERROR,
  CHECKOUT_COMPLETE_ERROR,
  paymentConfirmError,
  PAYMENT_DECLINED_ERROR,
  PAYMENT_INIT_ERROR,
} from "./checkout-error-messages"

/**
 * §1.9: jede kommunizierte Meldung nennt die verursachende Instanz UND die
 * konkrete Konsequenz für den Kunden.
 */
describe("checkout error messages (#60)", () => {
  describe("names the causing instance", () => {
    it.each([
      ["address load", CHECKOUT_ADDRESS_LOAD_ERROR, "Elysion"],
      ["preview", CHECKOUT_PREVIEW_ERROR, "Elysion"],
      ["complete", CHECKOUT_COMPLETE_ERROR, "Elysion"],
      ["declined", PAYMENT_DECLINED_ERROR, "Zahlungsdienstleister"],
      ["init", PAYMENT_INIT_ERROR, "Elysion"],
    ])("%s names %s", (_label, message, instance) => {
      expect(message).toContain(instance)
    })
  })

  describe("states the concrete consequence (nothing charged)", () => {
    it.each([
      CHECKOUT_ADDRESS_LOAD_ERROR,
      CHECKOUT_PREVIEW_ERROR,
      CHECKOUT_COMPLETE_ERROR,
      PAYMENT_DECLINED_ERROR,
      PAYMENT_INIT_ERROR,
    ])("mentions that nothing was charged / ordered", (message) => {
      expect(message).toMatch(/belastet|bestellt/)
    })
  })

  describe("paymentConfirmError", () => {
    it("keeps Stripe's instance-specific message and appends the consequence", () => {
      const msg = paymentConfirmError("Ihre Karte wurde abgelehnt.")
      expect(msg).toContain("Ihre Karte wurde abgelehnt.")
      expect(msg).toMatch(/nichts belastet/)
    })

    it("falls back to naming the payment provider when Stripe gives no message", () => {
      for (const empty of [undefined, null, "", "   "]) {
        const msg = paymentConfirmError(empty)
        expect(msg).toContain("Zahlungsdienstleister")
        expect(msg).toMatch(/nichts belastet/)
      }
    })
  })
})
