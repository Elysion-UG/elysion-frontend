import { describe, it, expect } from "vitest"

import { describeMismatchedFields } from "@/e2e/credential-redaction"

/**
 * Regression für #106.
 *
 * Der Vorgänger-Code prüfte die Formularwerte mit
 * `expect(feld).toHaveValue(passwort)`. Scheitert diese Assertion — und genau
 * das ist der Hydration-Fehlerfall, für den der Helper überhaupt existiert —,
 * schreibt Playwright das Passwort als „Expected string" in `error.message`.
 * Die Meldung landet wörtlich in `error-context.md` UND über den list-Reporter
 * im Actions-Log; der Log ist bei einem öffentlichen Repo dauerhaft einsehbar
 * und wird von `retention-days` nicht erfasst.
 *
 * `describeMismatchedFields()` meldet deshalb nur Feld-Labels. Diese Tests
 * fixieren genau diese Eigenschaft.
 *
 * Der Test liegt hier statt in e2e/, weil `e2e/fixtures/credential-fields.ts`
 * `@playwright/test` mitzieht — dieselbe Trennung wie bei der Trace-Policy.
 */
describe("Credential-Redaktion (#106)", () => {
  // Synthetisches Sentinel — NIE ein echter oder echt aussehender Wert.
  const SECRET = "NOT-A-REAL-PASSWORD"

  it("meldet nichts, wenn alle Felder ihren Sollwert tragen", () => {
    expect(
      describeMismatchedFields([
        { label: "E-Mail", matches: true },
        { label: "Passwort", matches: true },
      ])
    ).toBe("")
  })

  it("nennt nur das Label des abweichenden Feldes", () => {
    expect(
      describeMismatchedFields([
        { label: "E-Mail", matches: true },
        { label: "Passwort", matches: false },
      ])
    ).toBe("Passwort")
  })

  it("nennt alle Abweichler, wenn die Hydration beide Felder geleert hat", () => {
    expect(
      describeMismatchedFields([
        { label: "E-Mail", matches: false },
        { label: "Passwort", matches: false },
      ])
    ).toBe("E-Mail, Passwort")
  })

  it("gibt unter keinen Umständen einen Wert preis — nur Labels", () => {
    // Die Signatur nimmt bewusst kein `expected`/`actual` entgegen: Der
    // Vergleich passiert beim Aufrufer, hier kommt nur noch ein Boolean an.
    const report = describeMismatchedFields([{ label: "Passwort", matches: false }])

    expect(report).not.toContain(SECRET)
    expect(report).toBe("Passwort")
  })
})
