import { describe, it, expect } from "vitest"

import {
  REDACTED,
  describeMismatchedFields,
  redactSecrets,
  redactSecretsInError,
} from "@/e2e/credential-redaction"

/**
 * Regression für #106.
 *
 * Der Test liegt hier statt in `e2e/`, weil `e2e/fixtures/credential-fields.ts`
 * `@playwright/test` mitzieht — dieselbe Trennung wie bei der Trace-Policy.
 *
 * REICHWEITE, ehrlich: Diese Datei prüft nur die beiden Funktionen mit echter
 * Laufzeitlogik (`redactSecrets`/`redactSecretsInError`). Die Verwendung dieser
 * Helper in den Specs — also der eigentliche Regress „jemand ruft wieder
 * `fill()`/`toHaveValue()` direkt auf" — liegt außerhalb des Vitest-Scopes und
 * wird von der `no-restricted-syntax`-Regel in `eslint.config.mjs` abgedeckt.
 */

describe("describeMismatchedFields (#106)", () => {
  // Hinweis: Die Redaktion ist hier durch die SIGNATUR erzwungen — die Funktion
  // bekommt nur `{ label, matches }`, nie einen Wert. Diese Tests fixieren
  // deshalb das Ausgabeformat, nicht die Redaktion selbst.
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
})

describe("redactSecrets (#106)", () => {
  // Synthetisches Sentinel — NIE ein echter oder echt aussehender Wert.
  const SECRET = "NOT-A-REAL-PASSWORD"

  /**
   * Nachbau einer echten Playwright-Fehlermeldung: `ElementHandle._fill()`
   * loggt `  fill("<wert>")` VOR der Actionability-Prüfung, und
   * `Connection.dispatch()` hängt den Call-Log an `error.message`.
   */
  const CALL_LOG_MESSAGE = [
    "locator.fill: Timeout 30000ms exceeded.",
    "Call log:",
    '  - waiting for getByPlaceholder("Passwort")',
    "  -   locator resolved to <input type=\"password\" placeholder='Passwort'/>",
    `  -   fill("${SECRET}")`,
    "  -   waiting for element to be visible, enabled and editable",
  ].join("\n")

  it("entfernt den Wert aus dem Call-Log und lässt die Diagnose stehen", () => {
    const redacted = redactSecrets(CALL_LOG_MESSAGE, [SECRET])

    expect(redacted).not.toContain(SECRET)
    expect(redacted).toContain(`fill("${REDACTED}")`)
    // Genau die Zeile, für die man das Artefakt aufhebt, muss erhalten bleiben.
    expect(redacted).toContain("waiting for element to be visible, enabled and editable")
    expect(redacted).toContain("locator.fill: Timeout 30000ms exceeded.")
  })

  it("entfernt jedes Vorkommen, nicht nur das erste", () => {
    const redacted = redactSecrets(`${SECRET} ... ${SECRET}`, [SECRET])

    expect(redacted).not.toContain(SECRET)
    expect(redacted).toBe(`${REDACTED} ... ${REDACTED}`)
  })

  it("entfernt mehrere Geheimnisse — E-Mail ist ebenfalls ein Secret", () => {
    const email = "not-a-real-account@example.invalid"
    const redacted = redactSecrets(`fill("${email}") / fill("${SECRET}")`, [email, SECRET])

    expect(redacted).not.toContain(email)
    expect(redacted).not.toContain(SECRET)
  })

  it("ignoriert den leeren String — sonst zerlegte split('') den ganzen Text", () => {
    // clearCredentialFields() füllt bewusst "". Ohne Guard würde jede
    // Zeichengrenze ersetzt und die Meldung wäre unlesbar.
    expect(redactSecrets("Timeout 30000ms exceeded.", [""])).toBe("Timeout 30000ms exceeded.")
  })
})

describe("redactSecretsInError (#106)", () => {
  const SECRET = "NOT-A-REAL-PASSWORD"

  it("redigiert Meldung UND Stack", () => {
    // rewriteErrorMessage() baut den Stack als `${name}: ${message}\n at ...`
    // neu auf — die Meldung steht dort ein zweites Mal.
    const error = new Error(`locator.fill failed\n  fill("${SECRET}")`)
    error.stack = `Error: locator.fill failed\n  fill("${SECRET}")\n    at Object.<anonymous>`

    const redacted = redactSecretsInError(error, [SECRET])

    expect(redacted).toBe(error) // dasselbe Objekt — Zusatzfelder bleiben erhalten
    expect(error.message).not.toContain(SECRET)
    expect(error.stack).not.toContain(SECRET)
    expect(error.stack).toContain("at Object.<anonymous>")
  })

  it("erhält Zusatzfelder des Fehlerobjekts (errorContext, matcherResult)", () => {
    const error = Object.assign(new Error(`fill("${SECRET}")`), { matcherResult: { pass: false } })

    redactSecretsInError(error, [SECRET])

    expect(error.matcherResult).toEqual({ pass: false })
  })

  it("verkraftet einen geworfenen String", () => {
    expect(redactSecretsInError(`fill("${SECRET}")`, [SECRET])).toBe(`fill("${REDACTED}")`)
  })

  it("reicht Nicht-Fehler unverändert durch", () => {
    const thrown = { irgendwas: true }

    expect(redactSecretsInError(thrown, [SECRET])).toBe(thrown)
  })

  it("kommt mit einem Fehler ohne Stack klar", () => {
    const error = new Error(`fill("${SECRET}")`)
    delete error.stack

    redactSecretsInError(error, [SECRET])

    expect(error.message).not.toContain(SECRET)
  })
})
