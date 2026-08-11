/**
 * settlement.ts — die Abrechnungskette als Anzeigemodell (#53).
 *
 * `MANAGEMENT_DECISIONS.md` §1.1 beschreibt die Kette
 *
 * ```
 * Bruttoumsatz → Retoure → Elysion-Kommission → Stripe-Fee
 *   → Refund-/Chargeback-Abzug → Netto-Auszahlung
 * ```
 *
 * **Gerechnet wird sie im Backend.** Diese Datei rechnet nichts nach, sie ordnet
 * die gelieferten Positionen zu einer lesbaren Reihenfolge und prüft nur, ob die
 * Summe aufgeht. Geht sie nicht auf — weil das Backend eine Position ergänzt hat,
 * die das Frontend noch nicht kennt —, wird die Differenz als eigene Zeile
 * ausgewiesen, statt eine Spalte zu zeigen, die nicht addiert.
 *
 * Gerechnet wird dabei in **Cent** (`euroToCents`), nicht in Euro-Floats: Die
 * Kette besteht aus fünf Subtraktionen, und `110 - 10 - 15 - 1.9 - 15` liefert in
 * Float-Arithmetik nicht exakt `68.1`. Auf der Leitung sind die Beträge
 * Decimal EUR, wie überall im Vertrag.
 *
 * Der **Provisionssatz** taucht hier bewusst nirgends auf: Dem Verkäufer wird
 * laut §1.1 nur der absolute Betrag gezeigt, nie der Prozentsatz.
 */
import { euroToCents } from "@/src/lib/currency"

/** Eine Position der Kette. */
export interface FeeChainLine {
  /** Stabiler Schlüssel für React und Tests. */
  key: FeeChainLineKey
  label: string
  /**
   * Betrag in EUR, **vorzeichenbehaftet in Anzeigerichtung**: Abzüge sind
   * negativ, eine Gutschrift (aufgelöster Chargeback, Korrektur nach oben) ist
   * positiv.
   */
  amount: number
  /**
   * `"deduction"` zieht vom Brutto ab und geht in die Summe ein.
   * `"info"` ist eine reine Erläuterung (Refund-Fee) und wird **nicht** verrechnet.
   */
  kind: "deduction" | "info"
}

export type FeeChainLineKey =
  | "refunded"
  | "commission"
  | "stripeFee"
  | "refundFee"
  | "chargeback"
  | "residual"

export interface FeeChain {
  /** Bruttoumsatz — der Ausgangspunkt der Kette. */
  gross: number
  /** Positionen in Anzeigereihenfolge; leere (0,00 €) Abzüge fallen weg. */
  lines: FeeChainLine[]
  /** Summe aller Abzüge als **positiver** Betrag — für kompakte Spalten. */
  totalDeductions: number
  /** Netto-Auszahlung, wie vom Server geliefert. Darf negativ sein. */
  net: number
  /**
   * `false`, wenn der Server ein Netto liefert, das nicht zu den gelieferten
   * Positionen passt — dann trägt `lines` eine `residual`-Zeile mit der
   * Differenz, damit die Anzeige trotzdem aufgeht.
   */
  reconciles: boolean
}

/** Die Rohpositionen, unabhängig von der Feldbenennung des jeweiligen Endpoints. */
export interface FeeChainInput {
  grossAmount: number
  refundedAmount: number
  /** Elysion-Kommission (`platformFeeAmount` bzw. `feeAmount`). */
  commissionAmount: number
  stripeFeeAmount: number
  /** Anteil der Stripe-Fee ohne Gegenumsatz — **nicht** zusätzlich abziehen. */
  refundFeeAmount: number
  chargebackAmount: number
  netAmount: number
}

/**
 * Dreht das Vorzeichen für die Anzeige. `-0` wird dabei auf `0` gezogen:
 * `Intl.NumberFormat` formatiert die negative Null als „-0,00 €", und eine
 * Provision von null Euro als Minusbetrag zu zeigen wäre schlicht falsch.
 */
function negate(amount: number): number {
  return amount === 0 ? 0 : -amount
}

const LABELS: Record<Exclude<FeeChainLineKey, "residual">, string> = {
  refunded: "Erstattet (Retoure)",
  commission: "Elysion-Provision",
  stripeFee: "Stripe-Gebühr",
  refundFee: "davon Gebühr ohne Gegenumsatz",
  chargeback: "Chargeback-Abzug",
}

/**
 * Baut die Anzeigekette aus den Rohpositionen.
 *
 * Positionen mit `0,00 €` entfallen — eine Tabelle voller Nullzeilen macht die
 * Kette nicht nachvollziehbarer. `commission` bleibt auch bei `0` stehen, wenn
 * eine Retoure gebucht ist: Dass die Provision bei einer Vollretoure auf `0`
 * fällt (§1.1: kein Plattform-Verdienst auf Retouren), ist die Aussage, nicht
 * ihre Abwesenheit.
 */
export function buildFeeChain(input: FeeChainInput): FeeChain {
  const lines: FeeChainLine[] = []

  const push = (
    key: FeeChainLineKey,
    label: string,
    amount: number,
    kind: FeeChainLine["kind"]
  ) => {
    lines.push({ key, label, amount, kind })
  }

  if (euroToCents(input.refundedAmount) !== 0) {
    push("refunded", LABELS.refunded, negate(input.refundedAmount), "deduction")
  }
  if (euroToCents(input.commissionAmount) !== 0 || euroToCents(input.refundedAmount) !== 0) {
    push("commission", LABELS.commission, negate(input.commissionAmount), "deduction")
  }
  if (euroToCents(input.stripeFeeAmount) !== 0) {
    push("stripeFee", LABELS.stripeFee, negate(input.stripeFeeAmount), "deduction")
  }
  if (euroToCents(input.refundFeeAmount) !== 0) {
    push("refundFee", LABELS.refundFee, negate(input.refundFeeAmount), "info")
  }
  if (euroToCents(input.chargebackAmount) !== 0) {
    push("chargeback", LABELS.chargeback, negate(input.chargebackAmount), "deduction")
  }

  const deductedCents = lines
    .filter((line) => line.kind === "deduction")
    .reduce((sum, line) => sum + euroToCents(line.amount), 0)
  const residualCents =
    euroToCents(input.netAmount) - (euroToCents(input.grossAmount) + deductedCents)
  const reconciles = residualCents === 0

  if (!reconciles) {
    lines.push({
      key: "residual",
      label: "Weitere Korrektur",
      amount: residualCents / 100,
      kind: "deduction",
    })
  }

  const totalDeductionCents = lines
    .filter((line) => line.kind === "deduction")
    .reduce((sum, line) => sum + euroToCents(line.amount), 0)

  return {
    gross: input.grossAmount,
    lines,
    totalDeductions: -totalDeductionCents / 100,
    net: input.netAmount,
    reconciles,
  }
}

/** Kette einer einzelnen Abrechnungszeile (Seller- wie Admin-Sicht). */
export function settlementFeeChain(settlement: {
  grossAmount: number
  refundedAmount: number
  platformFeeAmount: number
  stripeFeeAmount: number
  refundFeeAmount: number
  chargebackAmount: number
  netAmount: number
}): FeeChain {
  return buildFeeChain({
    grossAmount: settlement.grossAmount,
    refundedAmount: settlement.refundedAmount,
    commissionAmount: settlement.platformFeeAmount,
    stripeFeeAmount: settlement.stripeFeeAmount,
    refundFeeAmount: settlement.refundFeeAmount,
    chargebackAmount: settlement.chargebackAmount,
    netAmount: settlement.netAmount,
  })
}

/** Kette einer fälligen Auszahlung — dieselben Positionen, je Seller verdichtet. */
export function duePayoutFeeChain(item: {
  grossAmount: number
  refundedAmount: number
  feeAmount: number
  stripeFeeAmount: number
  refundFeeAmount: number
  chargebackAmount: number
  netAmount: number
}): FeeChain {
  return buildFeeChain({
    grossAmount: item.grossAmount,
    refundedAmount: item.refundedAmount,
    commissionAmount: item.feeAmount,
    stripeFeeAmount: item.stripeFeeAmount,
    refundFeeAmount: item.refundFeeAmount,
    chargebackAmount: item.chargebackAmount,
    netAmount: item.netAmount,
  })
}
