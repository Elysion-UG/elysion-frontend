import { describe, it, expect } from "vitest"
import { buildContactMailto, contactSubjectLabel, type ContactFormData } from "./contact"

const baseData: ContactFormData = {
  name: "Max Mustermann",
  email: "max@example.com",
  subject: "order",
  message: "Wo ist meine Bestellung?",
}

describe("contactSubjectLabel", () => {
  it("maps a select value to the readable subject sent to the endpoint", () => {
    expect(contactSubjectLabel("order")).toBe("Hilfe bei einer Bestellung")
  })

  it("falls back to 'Anfrage' for an unknown value", () => {
    expect(contactSubjectLabel("weird")).toBe("Anfrage")
    expect(contactSubjectLabel("")).toBe("Anfrage")
  })

  it("always satisfies the backend's 3–150 character rule", () => {
    for (const value of ["general", "order", "product", "sustainability", "seller", "feedback"]) {
      const label = contactSubjectLabel(value)
      expect(label.length).toBeGreaterThanOrEqual(3)
      expect(label.length).toBeLessThanOrEqual(150)
    }
  })
})

// Der mailto-Weg ist seit #120 nur noch Fallback für einen fehlgeschlagenen
// Request — die Regeln bleiben dieselben.
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
