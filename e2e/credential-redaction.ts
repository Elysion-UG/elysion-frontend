/**
 * Redigierte Fehlermeldungen für Credential-Felder (#106).
 *
 * Eigenes Modul OHNE `@playwright/test`-Import, damit die Regel im Unit-Test
 * geladen werden kann — dieselbe Trennung wie bei `e2e/trace-policy.ts`.
 *
 * Hintergrund: Playwright schreibt `error.message` wörtlich in die
 * `error-context.md` (siehe `buildErrorContext()`) und über den list-Reporter
 * zusätzlich in den Actions-Log. Der Log ist bei einem öffentlichen Repo
 * dauerhaft einsehbar und wird — anders als Artefakte — von `retention-days`
 * NICHT erfasst. Eine Assertion wie `expect(feld).toHaveValue(passwort)` setzt
 * das Passwort als „Expected string" in genau diese Meldung.
 *
 * Deshalb melden wir bei einem Wertevergleich nur, WELCHES Feld abweicht,
 * niemals den erwarteten oder tatsächlichen Wert.
 */

export type FieldCheck = {
  /** Sprechender Feldname für die Fehlermeldung, z.B. "Passwort". */
  label: string
  /** Trägt das Feld seinen Sollwert? Der Vergleich passiert beim Aufrufer. */
  matches: boolean
}

/**
 * Fasst zusammen, welche Felder ihren Sollwert nicht tragen — ausschließlich
 * über die Labels.
 *
 * @returns Leerer String, wenn alle Felder passen (der Erfolgsfall, gegen den
 *   die Assertion prüft), sonst die Labels der Abweichler.
 */
export function describeMismatchedFields(checks: readonly FieldCheck[]): string {
  return checks
    .filter((check) => !check.matches)
    .map((check) => check.label)
    .join(", ")
}

/** Ersatztext für einen entfernten Geheimwert. Muss als solcher erkennbar sein. */
export const REDACTED = "[redigiert #106]"

/**
 * Entfernt bekannte Geheimwerte aus einem Text — wörtliche Vorkommen, kein
 * Muster-Raten.
 *
 * Gedacht für Playwright-Fehlermeldungen: Scheitert ein Aufruf, hängt
 * `Connection.dispatch()` den kompletten Call-Log per
 * `rewriteErrorMessage(err, err.message + formatCallLog(...))` an die Meldung —
 * und die geht in `error-context.md` UND in den öffentlichen Actions-Log.
 * Klassischer Fall war `ElementHandle._fill()`: Es schrieb `  fill("<wert>")`
 * in den Call-Log, BEVOR die Actionability-Prüfung lief (`coreBundle.js`,
 * `_fill` → `progress.log(...)` vor `_retryAction`). Seit
 * `fillCredentialField()` den Wert per `evaluate()` setzt, kennt kein Call-Log
 * den Wert mehr; die Redaktion bleibt als zweite Linie.
 *
 * Wir kürzen bewusst NICHT den ganzen Call-Log weg: die übrigen Zeilen
 * („waiting for element to be visible, enabled and editable") sind genau die
 * Diagnose, für die man das Artefakt aufhebt.
 *
 * @param secrets Werte, die verschwinden müssen. Leere Strings werden
 *   übersprungen — `"".split("")` zerlegte den Text sonst in Einzelzeichen
 *   (`clearCredentialFields()` füllt bewusst `""`). Kurze Werte werden NICHT
 *   ausgenommen: Unlesbarkeit ist harmloser als ein Leak.
 */
export function redactSecrets(text: string, secrets: readonly string[]): string {
  let result = text
  for (const secret of secrets) {
    if (!secret) continue
    result = result.split(secret).join(REDACTED)
  }
  return result
}

/**
 * Redigiert Meldung UND Stack eines Fehlers in place und gibt ihn zurück —
 * zum direkten Weiterwerfen gedacht.
 *
 * Der Stack muss mit: `rewriteErrorMessage()` baut ihn als
 * `${name}: ${message}\n    at ...` neu auf, die Meldung steht dort also ein
 * zweites Mal. Playwrights Fehler-Serialisierung nimmt beides.
 *
 * In place statt Kopie, damit Zusatzfelder (`errorContext`, `matcherResult`)
 * erhalten bleiben — eine Neu-Konstruktion verlöre sie.
 */
export function redactSecretsInError(error: unknown, secrets: readonly string[]): unknown {
  if (typeof error === "string") return redactSecrets(error, secrets)
  if (!(error instanceof Error)) return error

  error.message = redactSecrets(error.message, secrets)
  if (typeof error.stack === "string") error.stack = redactSecrets(error.stack, secrets)
  return error
}
