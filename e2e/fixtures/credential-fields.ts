/**
 * Credential-Felder so behandeln, dass Playwrights Fehler-Artefakte sie nicht
 * im Klartext veröffentlichen (#106). Das Repo ist öffentlich.
 *
 * Alle Aussagen unten sind am Quelltext von `playwright-core` 1.60
 * (`lib/coreBundle.js`) verifiziert, nicht aus der Doku abgeleitet.
 *
 * Vier Leak-Wege sind abgedeckt, ein fünfter ist offen (siehe unten):
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
 * 2. **Assertion-Meldung** (`error.message`, wörtlich in `error-context.md`
 *    UND im öffentlichen Actions-Log, den `retention-days` nicht erfasst).
 *    `expect(feld).toHaveValue(passwort)` setzt das Passwort als
 *    „Expected string" in die Meldung. Locator-Matcher hängen zusätzlich einen
 *    eigenen ARIA-Snapshot an, der ZUM FEHLERZEITPUNKT entsteht — späteres
 *    Leeren des Feldes hilft dagegen nicht.
 *    → {@link expectFieldsFilled} statt `toHaveValue()`
 *    (eine ESLint-Regel verbietet `toHaveValue` in den Login-Pfaden)
 *
 * 3. **Call-Log der `fill()`-Aktion** — derselbe Kanal wie 2, aber ohne
 *    Assertion. `ElementHandle._fill()` loggt
 *    `progress.log(\`  fill("${value}")\`)` VOR dem `_retryAction`, also vor
 *    der Actionability-Prüfung. Scheitert der Aufruf danach, hängt
 *    `Connection.dispatch()` den kompletten Call-Log per
 *    `rewriteErrorMessage(err, err.message + formatCallLog(...))` an die
 *    Meldung. Das trifft genau den Fall, für den dieses Modul existiert: Der
 *    Locator löst auf (Element attached), aber das Feld ist unsichtbar,
 *    disabled oder readonly — der Hydration-/Remount-Fall aus #107. Ist das
 *    Element NIE attached, scheitert schon der Selector-Schritt davor und der
 *    Wert taucht nicht auf; der Leak ist also nicht universell, aber real.
 *    → {@link fillCredentialField} statt `locator.fill()`
 *
 * 4. **Trace** (Request-Body des Logins) — in CI abgeschaltet,
 *    siehe `e2e/trace-policy.ts`.
 *
 * OFFEN — **Step-Titel im HTML-Report**: Die Protokoll-Metainfo für
 * `Frame.fill` lautet `title: 'Fill "{value}"'`. `onApiCallBegin` in
 * `playwright/lib/index.js` legt daraus für JEDEN `fill()`-Aufruf einen
 * `pw:api`-Step an, und der HTML-Reporter serialisiert Steps ohne
 * Kategorie-Filter (`dedupeSteps` in `runner/index.js`). Der Wert steht damit
 * im Step-Baum des `playwright-report`-Artefakts — auch bei GRÜNEM Lauf.
 * Kein `try/catch` erreicht das; `fill()` müsste durch einen
 * `locator.evaluate()`-Setter ersetzt werden (Metainfo dort: `title:
 * "Evaluate"`, ohne Parameter). Das ist ein eigener Umbau mit
 * React-Controlled-Input-Risiko und gehört in ein Folge-Issue. Screenshots und
 * Videos sind aus demselben Grund offen: das E-Mail-Feld rendert unmaskiert.
 */
import { expect, type Locator } from "@playwright/test"

import {
  describeMismatchedFields,
  redactSecretsInError,
  type FieldCheck,
} from "../credential-redaction"

/** Ein Feld mit dem Wert, den es tragen soll. */
export type CredentialField = {
  locator: Locator
  value: string
  /** Sprechender Name für Fehlermeldungen — NIE der Wert. */
  label: string
}

/**
 * Obergrenze fürs Leeren. `playwright.config.ts` setzt kein
 * `use.actionTimeout`, und der Default `0` heißt in `raceAgainstDeadline`
 * KEIN Timer: Ist das Feld beim Aufruf schon weg, liefe `fill("")` in den
 * 30-s-Test-Timeout statt in `.catch()`. Im `finally` ersetzte dann
 * „Test timeout exceeded" den echten Fehler — genau die Diagnose, für die man
 * das Artefakt aufhebt.
 */
const CLEAR_TIMEOUT_MS = 2_000

/**
 * Füllt ein Credential-Feld und hält den Wert aus einer möglichen
 * Fehlermeldung heraus.
 *
 * `locator.fill()` schreibt den Wert in den Call-Log, bevor geprüft wird, ob
 * das Feld überhaupt bedienbar ist (Weg 3 im Modul-Kopf). Wir fangen den
 * Fehler, redigieren Meldung und Stack und werfen dasselbe Fehlerobjekt
 * weiter — Diagnosezeilen und Zusatzfelder bleiben erhalten, nur der Wert
 * verschwindet.
 */
export async function fillCredentialField(
  field: Locator,
  value: string,
  options?: { timeout?: number }
): Promise<void> {
  try {
    await field.fill(value, options)
  } catch (error) {
    throw redactSecretsInError(error, [value])
  }
}

/**
 * Leert Credential-Felder, damit ein späterer Fehler-Snapshot sie nicht mehr
 * enthält.
 *
 * Aufruf gehört in ein `finally` um Füllen und Submit: Ist der Wert einmal im
 * Feld, muss er auch dann verschwinden, wenn der Submit-Klick in einen Timeout
 * läuft. Nach dem Klick sind die Werte bereits synchron im Login-Request, der
 * Login bleibt also unberührt.
 *
 * Fehler werden bewusst verschluckt: Bei Erfolg navigiert die Seite weg bzw.
 * das Login-Modal schließt, dann findet `fill("")` das Feld nicht mehr und
 * läuft in {@link CLEAR_TIMEOUT_MS}. Das ist der Normalfall, kein Problem.
 */
export async function clearCredentialFields(...fields: Locator[]): Promise<void> {
  for (const field of fields) {
    await field.fill("", { timeout: CLEAR_TIMEOUT_MS }).catch(() => {})
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
