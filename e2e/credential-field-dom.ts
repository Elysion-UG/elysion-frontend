/**
 * Setzt den Wert eines Credential-Feldes IM BROWSER, ohne ihn in Playwrights
 * Step-Titeln zu hinterlassen (#106, Leak-Weg 5).
 *
 * Warum nicht `locator.fill()`? Die Protokoll-Metainfo für `Frame.fill` lautet
 * `title: 'Fill "{value}"'` (`playwright-core/lib/coreBundle.js`, Tabelle
 * `protocolMetainfo`). `onApiCallBegin` in `playwright/lib/index.js` legt daraus
 * für JEDEN Aufruf einen `pw:api`-Step an, und der HTML-Reporter serialisiert
 * `step.title` ungefiltert (`_createTestStep` in `runner/index.js`). Der Wert
 * steht damit im Step-Baum des `playwright-report`-Artefakts — auch bei GRÜNEM
 * Lauf, wo weder Trace noch Screenshot noch `error-context.md` entstehen.
 *
 * Dasselbe gilt für jeden Tastatur-Weg: `Page.keyboardInsertText` →
 * `Insert "{text}"`, `Page.keyboardType`/`Frame.type` → `Type "{text}"`.
 * Wertfrei ist ausschließlich `evaluate`: `Frame.evaluateExpression` und
 * `ElementHandle.evaluateExpression` tragen `title: "Evaluate"` ohne
 * Platzhalter, und das Argument reist in `channel.params.arg` — das der
 * HTML-Reporter nicht serialisiert.
 *
 * DIESE FUNKTION LÄUFT IM SEITENKONTEXT. Playwright überträgt sie per
 * `String(pageFunction)`; sie darf deshalb NICHTS aus dem Modul-Scope
 * referenzieren — keine Imports, keine Konstanten, keine Hilfsfunktionen. Der
 * Test `src/lib/e2e-credential-field-dom.test.tsx` baut sie über
 * `new Function()` aus ihrem Quelltext neu auf und fängt einen Regress hier.
 *
 * Warum der Prototyp-Setter statt `element.value = ...`: Die Login-Felder sind
 * React-Controlled-Inputs (`EmailField`/`PasswordField`). React hängt an den
 * Knoten einen Value-Tracker, der `value` per `defineProperty` auf der INSTANZ
 * überschreibt. Eine direkte Zuweisung liefe durch diesen Tracker, der seinen
 * Merkwert mitzöge — React sähe beim `input`-Event keine Änderung und
 * verwürfe sie. Der Setter vom Prototyp umgeht die Instanz-Property, der
 * Tracker bleibt veraltet, React erkennt die Änderung und ruft `onChange`.
 * (`fill()` brauchte diesen Kniff nicht: Playwright tippt Text-Inputs über
 * echte CDP-Eingabeereignisse ein — genau der Weg, der den Wert in den
 * Step-Titel schreibt.)
 */

/** Ergebnis von {@link setCredentialFieldValue} — bewusst wertfrei. */
export type SetCredentialFieldResult =
  | "ok"
  | "no-window"
  | "not-an-input"
  | "disabled"
  | "readonly"
  | "no-native-setter"
  | "value-rejected"

/**
 * Schreibt `value` in `element` und feuert dieselben Events wie Playwrights
 * eigener Fill-Pfad (`injectedScript.fill`): `input` mit
 * `{ bubbles, composed }`, danach `change` mit `{ bubbles }`.
 *
 * Gibt einen Ergebniscode zurück, statt zu werfen: Ein geworfener Fehler würde
 * von Playwright serialisiert und um Call-Log-Zeilen ergänzt; der Aufrufer
 * formuliert die Meldung lieber selbst — wertfrei.
 *
 * Prüft `disabled`/`readOnly` selbst, weil `locator.evaluate()` nur auf
 * „attached" wartet und die Actionability-Prüfung von `fill()` hier fehlt. Die
 * Sichtbarkeit prüft der Aufrufer über `waitFor({ state: "visible" })`.
 */
export function setCredentialFieldValue(element: Element, value: string): SetCredentialFieldResult {
  const view = element.ownerDocument.defaultView
  if (!view) return "no-window"

  const isInput = element instanceof view.HTMLInputElement
  const isTextArea = element instanceof view.HTMLTextAreaElement
  if (!isInput && !isTextArea) return "not-an-input"

  const field = element as HTMLInputElement | HTMLTextAreaElement
  if (field.disabled) return "disabled"
  if (field.readOnly) return "readonly"

  const prototype = isInput ? view.HTMLInputElement.prototype : view.HTMLTextAreaElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set
  if (!setter) return "no-native-setter"

  field.focus()
  setter.call(field, value)
  field.dispatchEvent(new view.Event("input", { bubbles: true, composed: true }))
  field.dispatchEvent(new view.Event("change", { bubbles: true }))

  // Ein Controlled Input, dessen onChange den Wert verwirft (oder das noch
  // nicht hydratisierte Formular, das gleich neu rendert), fällt hier auf.
  return field.value === value ? "ok" : "value-rejected"
}
