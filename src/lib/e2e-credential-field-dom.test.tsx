import { describe, it, expect } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { useState } from "react"

import { setCredentialFieldValue, type SetCredentialFieldResult } from "@/e2e/credential-field-dom"
import { PasswordField } from "@/src/components/features/auth/_shared/PasswordField"

/**
 * Regression für #106, Leak-Weg 5.
 *
 * `locator.fill()` schreibt den Wert als Step-Titel `Fill "<wert>"` in den
 * `playwright-report` — auch bei GRÜNEM Lauf, wo weder Trace noch
 * `error-context.md` entstehen. Ersatz ist ein `locator.evaluate()`-Setter
 * (`e2e/credential-field-dom.ts`), dessen Step-Titel schlicht „Evaluate" heißt.
 *
 * Dieser Umbau hat zwei Risiken, die ohne echten Playwright-Lauf prüfbar sind
 * und hier geprüft werden:
 *
 *  1. **React-Controlled-Input.** Die Login-Felder sind Controlled Inputs.
 *     Playwrights `fill()` tippt Text-Inputs über echte CDP-Eingabeereignisse,
 *     unser Setter muss die Änderung synthetisch erzeugen. Tut er das falsch,
 *     verwirft React sie und der Login geht mit leerem Passwort raus.
 *  2. **Serialisierbarkeit.** Playwright überträgt die Funktion per
 *     `String(pageFunction)` in die Seite. Referenziert sie irgendwann etwas
 *     aus dem Modul-Scope, wirft sie dort einen ReferenceError.
 *
 * Was hier NICHT geprüft wird: dass Playwright den Step wirklich „Evaluate"
 * nennt. Das ist am Quelltext von playwright-core 1.60 verifiziert
 * (`protocolMetainfo`: `Frame.evaluateExpression` → `title: "Evaluate"`,
 * `Frame.fill` → `title: 'Fill "{value}"'`) und in
 * `e2e/credential-field-dom.ts` dokumentiert; nachmessen lässt es sich nur an
 * einem echten Report.
 */

const SECRET = "Test-Wert-42!"

/** Controlled Input wie im echten Login — plus Sichtfenster auf den React-State. */
function ControlledPasswordField({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <PasswordField label="Passwort" placeholder="Passwort" value={value} onChange={setValue} />
      <output data-testid="react-state">{value}</output>
    </>
  )
}

function renderControlledField(initial = "") {
  render(<ControlledPasswordField initial={initial} />)
  return screen.getByPlaceholderText("Passwort") as HTMLInputElement
}

/** React-State, wie ihn die Komponente sieht — nicht der DOM-Wert des Feldes. */
function reactState(): string {
  return screen.getByTestId("react-state").textContent ?? ""
}

/**
 * Setzt den Wert innerhalb von `act()`, damit React das State-Update flusht,
 * und reicht den Ergebniscode durch — `act()` selbst gibt ihn nicht zurück.
 */
function setInAct(
  setValue: typeof setCredentialFieldValue,
  element: Element,
  value: string
): SetCredentialFieldResult {
  let result: SetCredentialFieldResult | undefined
  act(() => {
    result = setValue(element, value)
  })
  return result as SetCredentialFieldResult
}

describe("setCredentialFieldValue — React-Controlled-Input (#106)", () => {
  it("setzt den Wert so, dass der React-State ihn übernimmt", () => {
    const input = renderControlledField()

    const result = setInAct(setCredentialFieldValue, input, SECRET)

    expect(result).toBe("ok")
    expect(input.value).toBe(SECRET)
    // Der eigentliche Beweis: Ohne onChange bliebe der State leer und React
    // würde das Feld beim nächsten Render wieder leeren.
    expect(reactState()).toBe(SECRET)
  })

  it("leert das Feld auch im React-State (der clear-Pfad nach dem Submit)", () => {
    const input = renderControlledField(SECRET)

    const result = setInAct(setCredentialFieldValue, input, "")

    expect(result).toBe("ok")
    expect(input.value).toBe("")
    expect(reactState()).toBe("")
  })

  it("naive Zuweisung erreicht React NICHT — Begründung für den Prototyp-Setter", () => {
    const input = renderControlledField()

    act(() => {
      // Genau das, was man ohne Kenntnis von React zuerst schreiben würde:
      // Die Zuweisung läuft durch Reacts Value-Tracker, der seinen Merkwert
      // mitzieht — beim input-Event sieht React keine Änderung.
      input.value = SECRET
      input.dispatchEvent(new Event("input", { bubbles: true }))
    })

    expect(reactState()).toBe("")
  })
})

describe("setCredentialFieldValue — Serialisierbarkeit (#106)", () => {
  it("läuft auch neu aufgebaut aus ihrem Quelltext — kein Zugriff auf den Modul-Scope", () => {
    // Playwright überträgt die Funktion genau so: String(fn), dann in der Seite
    // auswerten. Hängt sie an einem Import oder einer Modul-Konstante, wirft
    // dieser Aufruf einen ReferenceError.
    const rebuilt = new Function(
      `return (${String(setCredentialFieldValue)})`
    )() as typeof setCredentialFieldValue
    const input = renderControlledField()

    const result = setInAct(rebuilt, input, SECRET)

    expect(result).toBe("ok")
    expect(reactState()).toBe(SECRET)
  })
})

describe("setCredentialFieldValue — Actionability ohne fill() (#106)", () => {
  // `locator.evaluate()` wartet nur auf „attached". Die Prüfungen, die fill()
  // mitbrachte, muss der Setter selbst mitbringen — sonst schreibt er stumm in
  // ein Feld, das der Nutzer nie bedienen könnte, und der Test scheitert später
  // an einer ganz anderen Stelle.
  it("meldet ein disabled Feld statt es zu beschreiben", () => {
    render(<input placeholder="Passwort" type="password" disabled />)
    const input = screen.getByPlaceholderText("Passwort")

    expect(setCredentialFieldValue(input, SECRET)).toBe("disabled")
    expect((input as HTMLInputElement).value).toBe("")
  })

  it("meldet ein readonly Feld statt es zu beschreiben", () => {
    render(<input placeholder="Passwort" type="password" readOnly />)
    const input = screen.getByPlaceholderText("Passwort")

    expect(setCredentialFieldValue(input, SECRET)).toBe("readonly")
    expect((input as HTMLInputElement).value).toBe("")
  })

  it("meldet einen Locator, der nicht auf ein Eingabefeld zeigt", () => {
    render(<div data-testid="kein-feld" />)

    expect(setCredentialFieldValue(screen.getByTestId("kein-feld"), SECRET)).toBe("not-an-input")
  })

  it("beschreibt auch <textarea> — dort hängt der value-Setter an einem anderen Prototyp", () => {
    render(<textarea placeholder="Notiz" />)
    const textarea = screen.getByPlaceholderText("Notiz") as HTMLTextAreaElement

    expect(setInAct(setCredentialFieldValue, textarea, SECRET)).toBe("ok")
    expect(textarea.value).toBe(SECRET)
  })
})
