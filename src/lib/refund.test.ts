import { describe, it, expect } from "vitest"
import { ApiError } from "@/src/lib/api-client"
import { refundErrorMessage, remainingRefundable, validateRefundAmount } from "./refund"

describe("remainingRefundable", () => {
  it("zieht bereits Erstattetes vom Bruttobetrag ab", () => {
    expect(remainingRefundable({ grossAmount: 100, refundedAmount: 24.9 })).toBe(75.1)
  })

  it("behandelt eine Zeile ohne Erstattung als vollständig erstattbar", () => {
    expect(remainingRefundable({ grossAmount: 49.99 })).toBe(49.99)
  })

  it("wird nie negativ", () => {
    expect(remainingRefundable({ grossAmount: 10, refundedAmount: 12 })).toBe(0)
  })

  it("rechnet in Cent — 0.1 + 0.2 lässt keinen Float-Rest übrig", () => {
    expect(remainingRefundable({ grossAmount: 0.3, refundedAmount: 0.1 })).toBe(0.2)
  })
})

describe("validateRefundAmount — Vollerstattung", () => {
  it("schickt keinen Betrag mit, damit der Server den Restbetrag nimmt", () => {
    expect(validateRefundAmount({ mode: "full", remaining: 42 })).toEqual({
      ok: true,
      amount: undefined,
    })
  })

  it("lehnt ab, wenn nichts mehr offen ist", () => {
    const result = validateRefundAmount({ mode: "full", remaining: 0 })
    expect(result.ok).toBe(false)
  })

  it("erlaubt die Vollerstattung auch ohne bekannten Restbetrag", () => {
    expect(validateRefundAmount({ mode: "full", remaining: null })).toEqual({
      ok: true,
      amount: undefined,
    })
  })
})

describe("validateRefundAmount — Teilerstattung", () => {
  it("akzeptiert einen Betrag unterhalb des Restbetrags", () => {
    expect(validateRefundAmount({ mode: "partial", value: "24.90", remaining: 100 })).toEqual({
      ok: true,
      amount: 24.9,
    })
  })

  it("akzeptiert deutsche Kommaschreibweise", () => {
    expect(validateRefundAmount({ mode: "partial", value: "24,90", remaining: 100 })).toEqual({
      ok: true,
      amount: 24.9,
    })
  })

  it("akzeptiert exakt den Restbetrag", () => {
    expect(validateRefundAmount({ mode: "partial", value: "24,90", remaining: 24.9 })).toEqual({
      ok: true,
      amount: 24.9,
    })
  })

  it("lehnt einen Betrag über dem Restbetrag ab und nennt die Obergrenze", () => {
    const result = validateRefundAmount({ mode: "partial", value: "24,91", remaining: 24.9 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("24,90")
  })

  it("lehnt einen Cent über dem Restbetrag auch bei Float-anfälligen Werten ab", () => {
    const remaining = remainingRefundable({ grossAmount: 0.3, refundedAmount: 0.1 })
    expect(validateRefundAmount({ mode: "partial", value: "0,21", remaining }).ok).toBe(false)
    expect(validateRefundAmount({ mode: "partial", value: "0,20", remaining }).ok).toBe(true)
  })

  it("lehnt eine leere Eingabe ab", () => {
    expect(validateRefundAmount({ mode: "partial", value: "  ", remaining: 100 }).ok).toBe(false)
  })

  it("lehnt Null ab", () => {
    expect(validateRefundAmount({ mode: "partial", value: "0", remaining: 100 }).ok).toBe(false)
    expect(validateRefundAmount({ mode: "partial", value: "0,00", remaining: 100 }).ok).toBe(false)
  })

  it("lehnt negative Beträge ab", () => {
    expect(validateRefundAmount({ mode: "partial", value: "-5", remaining: 100 }).ok).toBe(false)
  })

  it("lehnt mehr als zwei Nachkommastellen ab", () => {
    const result = validateRefundAmount({ mode: "partial", value: "24,901", remaining: 100 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("Nachkommastellen")
  })

  it("lehnt nicht-numerische Eingaben ab", () => {
    expect(validateRefundAmount({ mode: "partial", value: "abc", remaining: 100 }).ok).toBe(false)
    expect(validateRefundAmount({ mode: "partial", value: "24,90 EUR", remaining: 100 }).ok).toBe(
      false
    )
    expect(validateRefundAmount({ mode: "partial", value: "1e3", remaining: 100 }).ok).toBe(false)
  })

  it("prüft ohne bekannten Restbetrag nur Form und Vorzeichen", () => {
    expect(validateRefundAmount({ mode: "partial", value: "999999", remaining: null })).toEqual({
      ok: true,
      amount: 999999,
    })
    expect(validateRefundAmount({ mode: "partial", value: "0", remaining: null }).ok).toBe(false)
  })
})

describe("refundErrorMessage", () => {
  const message = (status: number) => refundErrorMessage(new ApiError(status, "irrelevant"))

  it("nennt bei 400 die Eingabe als Instanz", () => {
    expect(message(400)).toContain("Eingabe")
    expect(message(400)).toContain("nichts erstattet")
  })

  it("meldet 403 als fehlende Berechtigung", () => {
    expect(message(403)).toContain("Zugriff verweigert")
  })

  it("meldet 404 als fehlende Abrechnungszeile", () => {
    expect(message(404)).toContain("Abrechnungszeile")
  })

  it("meldet 409 als bereits erstattet bzw. nicht erstattbar", () => {
    expect(message(409)).toContain("bereits vollständig erstattet")
    expect(message(409)).toContain("nichts gebucht")
  })

  it("weist 502/503 dem Zahlungsdienstleister zu", () => {
    expect(message(502)).toContain("Zahlungsdienstleister")
    expect(message(503)).toContain("Zahlungsdienstleister")
  })

  it("fällt bei unbekanntem Status und Nicht-ApiError auf Elysion zurück", () => {
    expect(message(500)).toContain("Elysion")
    expect(refundErrorMessage(new Error("boom"))).toContain("Elysion")
  })

  it("gibt nie die rohe Server-Meldung weiter", () => {
    expect(
      refundErrorMessage(new ApiError(409, "Order group is already fully refunded"))
    ).not.toContain("Order group")
  })
})
