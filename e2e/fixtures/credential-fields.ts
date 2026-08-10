/**
 * Credential-Felder so behandeln, dass Playwrights Fehler-Artefakte sie nicht
 * im Klartext veröffentlichen (#106). Das Repo ist öffentlich.
 *
 * Alle Aussagen unten sind am Quelltext von `playwright-core` 1.60
 * (`lib/coreBundle.js`) verifiziert, nicht aus der Doku abgeleitet.
 *
 * Fünf Leak-Wege sind abgedeckt:
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
 * 3. **Call-Log einer fehlgeschlagenen Aktion** — derselbe Kanal wie 2, aber
 *    ohne Assertion. Scheitert ein Aufruf, hängt `Connection.dispatch()` den
 *    kompletten Call-Log per
 *    `rewriteErrorMessage(err, err.message + formatCallLog(...))` an die
 *    Meldung, und die geht in `error-context.md` UND in den Actions-Log.
 *    `ElementHandle._fill()` schrieb dort `  fill("${value}")` hinein, VOR der
 *    Actionability-Prüfung — genau der Hydration-/Remount-Fall aus #107.
 *    Seit Weg 5 füllen wir nicht mehr über `fill()`; die Redaktion bleibt als
 *    zweite Linie, weil auch andere Aufrufe Call-Log-Zeilen anhängen.
 *    → {@link fillCredentialField} statt `locator.fill()`
 *
 * 4. **Trace** (Request-Body des Logins) — in CI abgeschaltet,
 *    siehe `e2e/trace-policy.ts`.
 *
 * 5. **Step-Titel im HTML-Report** — der einzige Weg, der auch bei GRÜNEM Lauf
 *    leckt und den weder `retention-days`-Kürzung noch Feld-Leeren erreicht.
 *    Die Protokoll-Metainfo für `Frame.fill` lautet `title: 'Fill "{value}"'`;
 *    `onApiCallBegin` (`playwright/lib/index.js`) legt daraus für jeden Aufruf
 *    einen `pw:api`-Step an, und `_createTestStep` (`runner/index.js`)
 *    serialisiert `step.title` ungefiltert in den `playwright-report`.
 *    Tastatur-Wege lecken genauso (`Insert "{text}"`, `Type "{text}"`).
 *    Wertfrei ist nur `evaluate` (`title: "Evaluate"`, keine Platzhalter; das
 *    Argument reist in `channel.params`, das der Reporter nicht schreibt).
 *    → {@link fillCredentialField} setzt den Wert über
 *    `locator.evaluate(setCredentialFieldValue, …)`, siehe
 *    `e2e/credential-field-dom.ts`.
 *
 * Screenshot und Video bleiben unkritisch: Das Passwortfeld rendert als Punkte
 * (`type="password"`), und beide entstehen nur bei Fehlschlag — zu dem
 * Zeitpunkt sind die Felder über {@link clearCredentialFields} geleert.
 */
import { expect, type Locator } from "@playwright/test"

import { setCredentialFieldValue, type SetCredentialFieldResult } from "../credential-field-dom"
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
 * KEIN Timer: Ist das Feld beim Aufruf schon weg, liefe das Leeren in den
 * 30-s-Test-Timeout statt in `.catch()`. Im `finally` ersetzte dann
 * „Test timeout exceeded" den echten Fehler — genau die Diagnose, für die man
 * das Artefakt aufhebt.
 */
const CLEAR_TIMEOUT_MS = 2_000

/**
 * Wertfreie Diagnose zu den Fehlercodes aus `setCredentialFieldValue()`.
 * Bewusst hier statt im Browser-Modul: Was in eine Fehlermeldung geht, gehört
 * an die Stelle, die die Meldung baut.
 */
const SET_FAILURE_REASONS: Record<Exclude<SetCredentialFieldResult, "ok">, string> = {
  "no-window": "Das Dokument des Feldes hat kein window (Frame schon entladen?).",
  "not-an-input": "Der Locator zeigt nicht auf ein <input> oder <textarea>.",
  disabled: "Das Feld ist disabled.",
  readonly: "Das Feld ist readonly.",
  "no-native-setter": "Kein nativer value-Setter am Element-Prototyp gefunden.",
  "value-rejected":
    "Das Feld trug den gesetzten Wert nach dem input-Event nicht mehr — " +
    "Controlled Input hat ihn verworfen oder die Hydration hat neu gerendert.",
}

/**
 * Füllt ein Credential-Feld, ohne den Wert in Playwrights Artefakten zu
 * hinterlassen.
 *
 * Der Wert wird über `locator.evaluate()` gesetzt statt über `fill()`: Nur
 * `evaluate` hat einen Step-Titel ohne Wert-Platzhalter (Weg 5 im Modul-Kopf).
 * Die Actionability-Prüfung, die `fill()` mitbrachte, holen wir hier nach —
 * `evaluate` wartet nur auf „attached":
 *   - sichtbar: `waitFor({ state: "visible" })` (dessen Fehlermeldung nennt nur
 *     den Locator, nie einen Wert),
 *   - bedienbar: `disabled`/`readOnly` prüft der Setter im Seitenkontext.
 *
 * Schlägt trotzdem etwas fehl, redigieren wir Meldung und Stack und werfen
 * dasselbe Fehlerobjekt weiter — Diagnosezeilen und Zusatzfelder bleiben
 * erhalten, nur der Wert verschwindet.
 */
export async function fillCredentialField(
  field: Locator,
  value: string,
  options?: { timeout?: number }
): Promise<void> {
  try {
    await field.waitFor({ state: "visible", timeout: options?.timeout })
    const result = await field.evaluate(setCredentialFieldValue, value, {
      timeout: options?.timeout,
    })
    if (result !== "ok") {
      throw new Error(
        `Credential-Feld konnte nicht gesetzt werden (Wert redigiert, #106): ${SET_FAILURE_REASONS[result]}`
      )
    }
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
 * das Login-Modal schließt, dann findet der Locator das Feld nicht mehr und
 * läuft in {@link CLEAR_TIMEOUT_MS}. Das ist der Normalfall, kein Problem.
 *
 * Auch hier `evaluate` statt `fill("")`: Ein leerer Wert wäre im Step-Titel
 * zwar harmlos, aber ein einziger `fill`-Aufruf in dieser Datei lädt dazu ein,
 * den nächsten mit echtem Wert daneben zu setzen. Eine ESLint-Regel verbietet
 * `fill` in den Credential-Pfaden deshalb komplett.
 */
export async function clearCredentialFields(...fields: Locator[]): Promise<void> {
  for (const field of fields) {
    await field.evaluate(setCredentialFieldValue, "", { timeout: CLEAR_TIMEOUT_MS }).catch(() => {})
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
