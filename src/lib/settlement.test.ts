import { describe, it, expect } from "vitest"
import { buildFeeChain, duePayoutFeeChain, settlementFeeChain } from "./settlement"

/**
 * Referenzfall aus `docs/api/settlements.md`: 100,00 € Ware + 10,00 € Versand,
 * 15 % Provision, 1,90 € Ist-Gebühr von Stripe → 93,10 € Netto.
 */
const plain = {
  grossAmount: 110,
  refundedAmount: 0,
  commissionAmount: 15,
  stripeFeeAmount: 1.9,
  refundFeeAmount: 0,
  chargebackAmount: 0,
  netAmount: 93.1,
}

describe("buildFeeChain", () => {
  it("führt Brutto, Abzüge und Netto der Referenzrechnung", () => {
    const chain = buildFeeChain(plain)

    expect(chain.gross).toBe(110)
    expect(chain.net).toBe(93.1)
    expect(chain.totalDeductions).toBe(16.9)
    expect(chain.reconciles).toBe(true)
    expect(chain.lines.map((line) => line.key)).toEqual(["commission", "stripeFee"])
  })

  it("zeigt Abzüge als negative Beträge in Anzeigerichtung", () => {
    const chain = buildFeeChain(plain)

    expect(chain.lines.find((line) => line.key === "commission")?.amount).toBe(-15)
    expect(chain.lines.find((line) => line.key === "stripeFee")?.amount).toBe(-1.9)
  })

  it("lässt Positionen mit 0,00 € weg statt Nullzeilen zu zeigen", () => {
    const chain = buildFeeChain(plain)

    expect(chain.lines.map((line) => line.key)).not.toContain("refunded")
    expect(chain.lines.map((line) => line.key)).not.toContain("chargeback")
    expect(chain.lines.map((line) => line.key)).not.toContain("refundFee")
  })

  it("hält die Provision auch bei 0,00 € fest, sobald eine Retoure gebucht ist", () => {
    // Vollretoure: Die Provision fällt laut §1.1 auf 0 — genau das ist die
    // Aussage der Zeile, ihr Fehlen wäre keine.
    const chain = buildFeeChain({
      grossAmount: 110,
      refundedAmount: 110,
      commissionAmount: 0,
      stripeFeeAmount: 1.9,
      refundFeeAmount: 1.9,
      chargebackAmount: 0,
      netAmount: -1.9,
    })

    expect(chain.lines.map((line) => line.key)).toEqual([
      "refunded",
      "commission",
      "stripeFee",
      "refundFee",
    ])
    expect(chain.net).toBe(-1.9)
    expect(chain.reconciles).toBe(true)
  })

  it("rechnet die Refund-Fee nicht mit — sie steckt bereits in der Stripe-Gebühr", () => {
    const chain = buildFeeChain({
      ...plain,
      refundedAmount: 50,
      commissionAmount: 8.18,
      refundFeeAmount: 0.86,
      netAmount: 49.92, // 110 − 50 − 8,18 − 1,90; die Refund-Fee ist nicht enthalten
    })

    const refundFee = chain.lines.find((line) => line.key === "refundFee")
    expect(refundFee?.kind).toBe("info")
    // Die Info-Zeile fließt nicht in die Summe der Abzüge ein — die Kette geht
    // ohne sie auf, und der Abzug bleibt bei 60,08 € statt 60,94 €.
    expect(chain.reconciles).toBe(true)
    expect(chain.lines.filter((line) => line.kind === "deduction").length).toBe(3)
    expect(chain.totalDeductions).toBe(60.08)
  })

  it("weist eine nicht aufgehende Kette als Korrekturzeile aus, statt sie zu verschweigen", () => {
    // Serverseitig ergänzte Position, die das Frontend noch nicht kennt:
    // 110 − 15 − 1,90 = 93,10, geliefert werden aber 90,00.
    const chain = buildFeeChain({ ...plain, netAmount: 90 })

    expect(chain.reconciles).toBe(false)
    const residual = chain.lines.find((line) => line.key === "residual")
    expect(residual).toBeDefined()
    expect(residual?.amount).toBe(-3.1)
    // Mit der Korrekturzeile addiert die Aufstellung wieder auf das Netto.
    expect(chain.gross - chain.totalDeductions).toBeCloseTo(chain.net, 2)
  })

  it("rechnet in Cent — fünf Float-Subtraktionen würden hier daneben landen", () => {
    // 110 - 10 - 15 - 1.9 - 15 ist in Float-Arithmetik nicht exakt 68.1.
    const chain = buildFeeChain({
      grossAmount: 110,
      refundedAmount: 10,
      commissionAmount: 15,
      stripeFeeAmount: 1.9,
      refundFeeAmount: 0,
      chargebackAmount: 15,
      netAmount: 68.1,
    })

    expect(chain.reconciles).toBe(true)
    expect(chain.totalDeductions).toBe(41.9)
  })
})

describe("settlementFeeChain", () => {
  it("bildet platformFeeAmount auf die Provisionszeile ab", () => {
    const chain = settlementFeeChain({
      grossAmount: 110,
      refundedAmount: 0,
      platformFeeAmount: 15,
      stripeFeeAmount: 1.9,
      refundFeeAmount: 0,
      chargebackAmount: 0,
      netAmount: 93.1,
    })

    expect(chain.lines.find((line) => line.key === "commission")?.amount).toBe(-15)
    expect(chain.net).toBe(93.1)
  })
})

describe("duePayoutFeeChain", () => {
  it("bildet feeAmount der Fälligkeitsliste auf dieselbe Provisionszeile ab", () => {
    const chain = duePayoutFeeChain({
      grossAmount: 160,
      refundedAmount: 10,
      feeAmount: 22.5,
      stripeFeeAmount: 2.9,
      refundFeeAmount: 0.4,
      chargebackAmount: 15,
      netAmount: 109.6,
    })

    expect(chain.lines.map((line) => line.key)).toEqual([
      "refunded",
      "commission",
      "stripeFee",
      "refundFee",
      "chargeback",
    ])
    expect(chain.reconciles).toBe(true)
    expect(chain.totalDeductions).toBe(50.4)
  })
})
