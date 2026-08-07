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
