import { describe, it, expect } from "vitest"
import {
  buildContactMailto,
  contactSubjectLabel,
  validateContactForm,
  CONTACT_SUBJECTS,
  CONTACT_LIMITS,
  type ContactFormData,
} from "./contact"

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

  // Diese Zusicherung ersetzt eine Laufzeitprüfung in validateContactForm: die
  // Auswahl ist eine feste Liste, also gehört die Garantie hierher.
  it("always satisfies the backend's 3–150 character rule", () => {
    for (const subject of CONTACT_SUBJECTS) {
      const label = contactSubjectLabel(subject.value)
      expect(label.length).toBeGreaterThanOrEqual(CONTACT_LIMITS.subject.min)
      expect(label.length).toBeLessThanOrEqual(CONTACT_LIMITS.subject.max)
    }
    expect(contactSubjectLabel("weird").length).toBeGreaterThanOrEqual(CONTACT_LIMITS.subject.min)
  })
})

// Ohne diese Prüfung antwortet der Endpoint mit dem englischen „Validation
// failed" ohne Feldbezug — der api-client lokalisiert nur den 429-Fall.
describe("validateContactForm", () => {
  it("accepts valid input", () => {
    expect(validateContactForm(baseData)).toEqual({})
  })

  it("rejects a message shorter than the contract's 10 characters", () => {
    const errors = validateContactForm({ ...baseData, message: "Hilfe!" })
    expect(errors.message).toMatch(/mindestens 10 Zeichen/)
  })

  it("rejects a message longer than 5000 characters", () => {
    const errors = validateContactForm({ ...baseData, message: "a".repeat(5001) })
    expect(errors.message).toMatch(/höchstens 5000/)
  })

  it("measures the trimmed value — the endpoint rejects btrim-empty fields", () => {
    expect(
      validateContactForm({ ...baseData, message: `   ${"a".repeat(9)}   ` }).message
    ).toBeDefined()
    expect(validateContactForm({ ...baseData, name: "  M  " }).name).toBeDefined()
  })

  it("rejects a name outside 2–100 characters", () => {
    expect(validateContactForm({ ...baseData, name: "M" }).name).toMatch(/mindestens 2 Zeichen/)
    expect(validateContactForm({ ...baseData, name: "M".repeat(101) }).name).toMatch(
      /höchstens 100/
    )
  })

  it("rejects a malformed or missing email", () => {
    expect(validateContactForm({ ...baseData, email: "" }).email).toBeDefined()
    expect(validateContactForm({ ...baseData, email: "not-an-email" }).email).toMatch(/gültige/)
    expect(validateContactForm({ ...baseData, email: `a@b.de${"x".repeat(320)}` }).email).toMatch(
      /höchstens 320/
    )
  })

  it("rejects a CRLF in the email — the endpoint treats it as header injection", () => {
    expect(validateContactForm({ ...baseData, email: "a@b.de\r\nBcc: x@y.de" }).email).toBeDefined()
  })

  it("requires a chosen subject", () => {
    expect(validateContactForm({ ...baseData, subject: "" }).subject).toMatch(/Betreff/)
  })

  it("reports every offending field at once, not just the first", () => {
    const errors = validateContactForm({ name: "", email: "nope", subject: "", message: "hi" })
    expect(Object.keys(errors).sort()).toEqual(["email", "message", "name", "subject"])
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
