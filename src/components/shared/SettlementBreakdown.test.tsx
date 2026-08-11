import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import SettlementBreakdown from "./SettlementBreakdown"
import { settlementFeeChain } from "@/src/lib/settlement"

/** Nicht-brechendes Leerzeichen aus `Intl.NumberFormat("de-DE")` vor dem €-Zeichen. */
const euro = (text: string) => text.replace(/ /g, " ")

const amounts = () => screen.getAllByText(/€/).map((node) => euro(node.textContent ?? "").trim())

describe("SettlementBreakdown", () => {
  const full = settlementFeeChain({
    grossAmount: 110,
    refundedAmount: 10,
    platformFeeAmount: 15,
    stripeFeeAmount: 1.9,
    refundFeeAmount: 0.4,
    chargebackAmount: 15,
    netAmount: 68.1,
  })

  it("zeigt die Kette in der Reihenfolge Brutto → Abzüge → Netto", () => {
    render(<SettlementBreakdown chain={full} />)

    expect(amounts()).toEqual([
      "110,00 €",
      "-10,00 €",
      "-15,00 €",
      "-1,90 €",
      "-0,40 €",
      "-15,00 €",
      "68,10 €",
    ])
  })

  it("benennt jede Position, damit die Abzüge zuordenbar sind", () => {
    render(<SettlementBreakdown chain={full} />)

    expect(screen.getByText("Bruttoumsatz")).toBeInTheDocument()
    expect(screen.getByText("Erstattet (Retoure)")).toBeInTheDocument()
    expect(screen.getByText("Elysion-Provision")).toBeInTheDocument()
    expect(screen.getByText("Stripe-Gebühr")).toBeInTheDocument()
    expect(screen.getByText("Chargeback-Abzug")).toBeInTheDocument()
    expect(screen.getByText("Netto-Auszahlung")).toBeInTheDocument()
  })

  it("setzt die Refund-Fee als Erläuterung unter die Stripe-Gebühr, nicht als Abzug", () => {
    render(<SettlementBreakdown chain={full} />)

    const label = screen.getByText("davon Gebühr ohne Gegenumsatz")
    expect(label.className).toContain("italic")
    // Sie ist eingerückt und damit sichtbar untergeordnet.
    expect(label.parentElement?.className).toContain("pl-4")
  })

  it("nennt die Netto-Zeile auf Wunsch anders (Fälligkeitsliste)", () => {
    render(<SettlementBreakdown chain={full} netLabel="Auszuzahlen" />)

    expect(screen.getByText("Auszuzahlen")).toBeInTheDocument()
    expect(screen.queryByText("Netto-Auszahlung")).not.toBeInTheDocument()
  })

  it("erklärt ein negatives Netto als Verrechnung statt es als Fehler zu zeigen", () => {
    const negative = settlementFeeChain({
      grossAmount: 110,
      refundedAmount: 110,
      platformFeeAmount: 0,
      stripeFeeAmount: 1.9,
      refundFeeAmount: 1.9,
      chargebackAmount: 0,
      netAmount: -1.9,
    })

    render(<SettlementBreakdown chain={negative} />)

    // Brutto, Retoure, die auf null gefallene Provision (ohne negative Null),
    // Stripe-Gebühr samt Refund-Anteil und das negative Netto.
    expect(amounts()).toEqual(["110,00 €", "-110,00 €", "0,00 €", "-1,90 €", "-1,90 €", "-1,90 €"])
    expect(screen.getByText(/mit der nächsten Auszahlung verrechnet/)).toBeInTheDocument()
  })

  it("weist eine nicht aufgehende Aufstellung sichtbar aus", () => {
    const drifted = settlementFeeChain({
      grossAmount: 110,
      refundedAmount: 0,
      platformFeeAmount: 15,
      stripeFeeAmount: 1.9,
      refundFeeAmount: 0,
      chargebackAmount: 0,
      netAmount: 90,
    })

    render(<SettlementBreakdown chain={drifted} />)

    expect(screen.getByText("Weitere Korrektur")).toBeInTheDocument()
    expect(screen.getByText(/Verbindlich ist der Settlement-Bericht/)).toBeInTheDocument()
  })

  it("lässt leere Positionen weg", () => {
    const plain = settlementFeeChain({
      grossAmount: 110,
      refundedAmount: 0,
      platformFeeAmount: 15,
      stripeFeeAmount: 1.9,
      refundFeeAmount: 0,
      chargebackAmount: 0,
      netAmount: 93.1,
    })

    render(<SettlementBreakdown chain={plain} />)

    expect(screen.queryByText("Chargeback-Abzug")).not.toBeInTheDocument()
    expect(screen.queryByText("Erstattet (Retoure)")).not.toBeInTheDocument()
    expect(amounts()).toEqual(["110,00 €", "-15,00 €", "-1,90 €", "93,10 €"])
  })
})
