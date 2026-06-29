import { describe, it, expect } from "vitest"
import { buildContactMailto, type ContactFormData } from "./contact"

const baseData: ContactFormData = {
  name: "Max Mustermann",
  email: "max@example.com",
  subject: "order",
  message: "Wo ist meine Bestellung?",
}

describe("buildContactMailto", () => {
  it("builds a mailto URL to the given support address", () => {
    const url = buildContactMailto(baseData, "support@test.dev")
    expect(url.startsWith("mailto:support@test.dev?")).toBe(true)
  })

  it("maps the subject value to its human-readable label", () => {
    const url = buildContactMailto(baseData, "s@t.dev")
    expect(decodeURIComponent(url)).toContain("[Elysion Kontakt] Hilfe bei einer Bestellung")
  })

  it("falls back to 'Anfrage' for an unknown subject", () => {
    const url = buildContactMailto({ ...baseData, subject: "weird" }, "s@t.dev")
    expect(decodeURIComponent(url)).toContain("[Elysion Kontakt] Anfrage")
  })

  it("includes the sender name, email and message in the body", () => {
    const decoded = decodeURIComponent(buildContactMailto(baseData, "s@t.dev"))
    expect(decoded).toContain("Name: Max Mustermann")
    expect(decoded).toContain("E-Mail: max@example.com")
    expect(decoded).toContain("Wo ist meine Bestellung?")
  })

  it("URL-encodes subject and body", () => {
    const url = buildContactMailto(baseData, "s@t.dev")
    // raw spaces must not appear in the encoded query string
    expect(url.split("?")[1]).not.toContain(" ")
  })
})
