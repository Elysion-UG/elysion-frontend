import { describe, it, expect } from "vitest"
import { isAllowedStripeRedirect, assertStripeRedirectUrl } from "./stripe-redirect"

describe("isAllowedStripeRedirect", () => {
  it("accepts the Stripe Connect onboarding host", () => {
    expect(isAllowedStripeRedirect("https://connect.stripe.com/setup/e/acct_123")).toBe(true)
  })

  it("accepts the Stripe dashboard host", () => {
    expect(isAllowedStripeRedirect("https://dashboard.stripe.com/account")).toBe(true)
  })

  it("rejects a look-alike host that only shares a prefix", () => {
    // startsWith-basierte Prüfungen würden hier faelschlich durchlassen
    expect(isAllowedStripeRedirect("https://connect.stripe.com.evil.com/phish")).toBe(false)
  })

  it("rejects a non-https scheme", () => {
    expect(isAllowedStripeRedirect("http://connect.stripe.com/setup")).toBe(false)
  })

  it("rejects a javascript: pseudo-URL", () => {
    expect(isAllowedStripeRedirect("javascript:alert(1)")).toBe(false)
  })

  it("rejects an unrelated host", () => {
    expect(isAllowedStripeRedirect("https://example.com")).toBe(false)
  })

  it("rejects a malformed URL", () => {
    expect(isAllowedStripeRedirect("not a url")).toBe(false)
  })

  it("rejects an empty string", () => {
    expect(isAllowedStripeRedirect("")).toBe(false)
  })
})

describe("assertStripeRedirectUrl", () => {
  it("returns the URL unchanged when allowed", () => {
    const url = "https://connect.stripe.com/setup/e/acct_123"
    expect(assertStripeRedirectUrl(url)).toBe(url)
  })

  it("throws for a disallowed URL", () => {
    expect(() => assertStripeRedirectUrl("https://evil.com")).toThrow("Ungültige Redirect-URL")
  })
})
