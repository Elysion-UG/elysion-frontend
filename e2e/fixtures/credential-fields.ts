/**
 * Credential-Felder so behandeln, dass Playwrights Fehler-Artefakte sie nicht
 * im Klartext veröffentlichen (#106). Das Repo ist öffentlich.
 *
 * Es gibt drei unabhängige Leak-Wege; die ersten beiden deckt dieses Modul ab,
 * der dritte ist über `e2e/trace-policy.ts` erledigt:
 *
 * 1. **ARIA-Snapshot** („Page snapshot" in `error-context.md`).
 *    Playwrights `toAriaNode()` schreibt für JEDES `<input>` außer
 *    checkbox/radio/file `element.value` in den Snapshot — `type="password"`
 *    ist ausdrücklich NICHT ausgenommen, und es gibt keine Option, die
 *    Eingabewerte ausblendet. Der Wert muss also zum Snapshot-Zeitpunkt weg
 *    sein. Dieser Snapshot entsteht erst im Teardown (`didFinishTest`) —
 *    Leeren direkt nach dem Submit genügt deshalb.
 *    → {@link clearCredentialFields}
 *
 * 2. **Fehlermeldung** (`error.message`, wörtlich in `error-context.md` UND im
 *    öffentlichen Actions-Log, den `retention-days` nicht erfasst).
 *    `expect(feld).toHaveValue(passwort)` setzt das Passwort als
 *    „Expected string" in die Meldung. Locator-Matcher hängen zusätzlich einen
 *    eigenen ARIA-Snapshot an, der ZUM FEHLERZEITPUNKT entsteht — späteres
 *    Leeren des Feldes hilft dagegen nicht.
 *    → {@link expectFieldsFilled} statt `toHaveValue()`
 *
 * 3. **Trace** (Request-Body des Logins) — in CI abgeschaltet,
 *    siehe `e2e/trace-policy.ts`.
 */
import { expect, type Locator } from "@playwright/test"

import { describeMismatchedFields, type FieldCheck } from "../credential-redaction"

/** Ein Feld mit dem Wert, den es tragen soll. */
export type CredentialField = {
  locator: Locator
  value: string
  /** Sprechender Name für Fehlermeldungen — NIE der Wert. */
  label: string
}

/**
 * Leert Credential-Felder, damit ein späterer Fehler-Snapshot sie nicht mehr
 * enthält.
 *
 * Aufruf gehört unmittelbar hinter den Submit-Klick: Die Werte sind dort
 * bereits synchron in den Login-Request übernommen, der Login läuft also
 * unverändert. Bei Erfolg navigiert die Seite weg und `fill()` wirft — das ist
 * erwartet und wird bewusst verschluckt, ebenso ein geschlossenes Login-Modal.
 */
export async function clearCredentialFields(...fields: Locator[]): Promise<void> {
  for (const field of fields) {
    await field.fill("").catch(() => {})
  }
}

/**
 * Wartet, bis alle Felder GLEICHZEITIG ihren Sollwert tragen — ohne die Werte
 * in die Fehlermeldung zu schreiben. Ersatz für `expect(feld).toHaveValue(...)`
 * überall dort, wo der Sollwert ein Geheimnis ist.
 *
 * Gleichzeitig ist wesentlich: Wird Feld für Feld einzeln geprüft, kann die
 * Hydration ein bereits verifiziertes Feld in der Lücke wieder leeren (#107).
 */
export async function expectFieldsFilled(
  fields: readonly CredentialField[],
  options: { timeout: number }
): Promise<void> {
  await expect
    .poll(
      async () => {
        const checks: FieldCheck[] = []
        for (const { locator, value, label } of fields) {
          checks.push({ label, matches: (await locator.inputValue()) === value })
        }
        return describeMismatchedFields(checks)
      },
      {
        timeout: options.timeout,
        message:
          "Felder trugen ihren Sollwert nicht gleichzeitig — abweichende Felder " +
          "(Werte redigiert, #106)",
      }
    )
    .toBe("")
}
