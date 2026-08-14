/**
 * Erstattungen (Backend #142, Management-Decision §1.4).
 *
 * Bezugsgröße ist immer **genau eine OrderGroup** — nie eine Order und nie eine
 * einzelne Position. Nur so lässt sich die Gegenbuchung eindeutig einer
 * Abrechnungszeile zuordnen. Der Client schickt deshalb weder `paymentId` noch
 * `sellerId`; beides löst der Server aus der Settlement-Zeile bzw. dem
 * SecurityContext auf.
 *
 * Wire-Format der Beträge ist **Decimal EUR** (die DB führt Cent) — genau wie
 * bei Settlements und Payouts. Vertrag: Backend `docs/api/refunds.md`.
 */

export type RefundStatus = "PENDING" | "SUCCEEDED" | "FAILED"

/** Wer die Erstattung ausgelöst hat — Seller-Self-Service oder Admin-Eskalation. */
export type RefundInitiator = "SELLER" | "ADMIN"

export interface RefundRequestDTO {
  orderGroupId: string
  /**
   * Betrag in EUR, höchstens zwei Nachkommastellen.
   * **Weglassen = Vollerstattung** des kompletten Restbetrags.
   */
  amount?: number
  /** Freitext, max. 500 Zeichen; landet am Refund und im Audit-Log. */
  reason?: string
}

/**
 * Ergebnis einer Erstattung samt Wirkung auf die Abrechnungszeile.
 *
 * Die `settlement*`-Felder liefert das Backend bewusst mit: Seller wie Admin
 * sehen die Wirkung auf die Auszahlung sofort, ohne die Settlement-Liste erneut
 * abzufragen — im Frontend wird deshalb **nichts** davon nachgerechnet.
 */
export interface RefundResult {
  refundId: string
  paymentId: string
  orderId: string
  orderGroupId: string
  sellerId: string
  /** Erstatteter Betrag in EUR. */
  amount: number
  currency: string
  status: RefundStatus
  /** Stripe-Refund-ID; `null`, solange der Provider keine geliefert hat. */
  providerRefundId: string | null
  initiatedBy: RefundInitiator
  reason: string | null
  /** Insgesamt auf der Zeile erstattet. */
  settlementRefundedAmount: number
  /** Was auf der Zeile noch erstattbar bleibt. */
  settlementRemainingRefundableAmount: number
  /** Provision **nach** anteiliger Rückgabe. */
  settlementPlatformFeeAmount: number
  /** Anteil der Ist-Gebühr ohne Gegenumsatz — bleibt beim Verkäufer. */
  settlementRefundFeeAmount: number
  /** Netto der Zeile — **darf negativ sein** (Ist-Gebühr nach Vollerstattung). */
  settlementNetAmount: number
  /** Zeile ist korrekturbedürftig und von der Auszahlung ausgenommen. */
  settlementAdjustmentRequired: boolean
}
