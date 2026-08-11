/**
 * Zod-Schemata der Abrechnungskette (#53, Backend #140).
 *
 * `GET /api/v1/seller/settlements` und `GET /api/v1/admin/settlements` liefern
 * **denselben** Zeilenvertrag (Backend `docs/api/settlements.md`), die
 * Fälligkeitsliste `GET /api/v1/admin/payouts/due` dieselbe Kette in
 * verdichteter Form (`docs/api/payouts.md`) — die Schemata liegen deshalb hier
 * und nicht dreifach in den Services.
 *
 * Validiert wird an der Boundary (`parseApiResponse`), nicht gecastet: Das sind
 * neun Geldfelder auf dem Auszahlungspfad, und ein umbenanntes oder
 * weggefallenes Feld darf nicht still als `undefined` in eine Betragsanzeige
 * laufen (#38). Genau das ist hier vorher passiert — `listSettlements()` hat die
 * Antwort ungeprüft gecastet.
 */
import { z } from "zod"
import type { PayoutDueItem, Settlement } from "@/src/types"

/**
 * Geldbetrag auf der Leitung: **Decimal EUR**, nicht Cent (die DB führt Cent,
 * der Service-Layer des Backends teilt durch 100). Negative Werte sind
 * zulässig — nach einer Vollretoure ist das Netto negativ in Höhe der Ist-Gebühr.
 */
const money = z.number()

export const apiSettlementSchema = z.object({
  settlementId: z.string(),
  /**
   * Nur die Admin-Sicht braucht die Gruppe zwingend (Erstattung aus der Zeile
   * heraus); der Vertrag führt sie auf beiden Seiten, das `nullish` ist
   * Defensive gegen Altzeilen.
   */
  orderGroupId: z.string().nullish(),
  sellerId: z.string(),
  grossAmount: money,
  goodsAmount: money,
  shippingAmount: money,
  refundedAmount: money,
  platformFeeAmount: money,
  stripeFeeAmount: money,
  refundFeeAmount: money,
  chargebackAmount: money,
  netAmount: money,
  currency: z.string().nullish(),
  status: z.string(),
  adjustmentRequired: z.boolean().nullish(),
  eligibleAt: z.string().nullish(),
  createdAt: z.string(),
})

export const apiSettlementListSchema = z.array(apiSettlementSchema)

export const apiSettlementPageSchema = z.object({
  items: z.array(apiSettlementSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
})

type ApiSettlement = z.infer<typeof apiSettlementSchema>

/** Hebt die nullbaren Felder auf `undefined` — der Typ kennt kein `null`. */
export function normalizeSettlement(raw: ApiSettlement): Settlement {
  return {
    settlementId: raw.settlementId,
    orderGroupId: raw.orderGroupId ?? undefined,
    sellerId: raw.sellerId,
    grossAmount: raw.grossAmount,
    goodsAmount: raw.goodsAmount,
    shippingAmount: raw.shippingAmount,
    refundedAmount: raw.refundedAmount,
    platformFeeAmount: raw.platformFeeAmount,
    stripeFeeAmount: raw.stripeFeeAmount,
    refundFeeAmount: raw.refundFeeAmount,
    chargebackAmount: raw.chargebackAmount,
    netAmount: raw.netAmount,
    currency: raw.currency ?? undefined,
    status: raw.status,
    adjustmentRequired: raw.adjustmentRequired ?? undefined,
    eligibleAt: raw.eligibleAt ?? undefined,
    createdAt: raw.createdAt,
  }
}

/**
 * Kontostatus des Connect-Express-Kontos. Als Enum geführt, weil die
 * Freigabe-Schaltfläche daran hängt: ein unbekannter Wert würde sonst still als
 * „nicht freigebbar" durchlaufen, statt den Vertragsbruch zu melden.
 */
export const payoutAccountStatusSchema = z.enum([
  "NOT_CONNECTED",
  "PENDING",
  "ACTIVE",
  "RESTRICTED",
])

export const apiDuePayoutSchema = z.object({
  sellerId: z.string(),
  sellerName: z.string(),
  payoutAccountStatus: payoutAccountStatusSchema,
  settlementCount: z.number(),
  grossAmount: money,
  refundedAmount: money,
  feeAmount: money,
  stripeFeeAmount: money,
  refundFeeAmount: money,
  chargebackAmount: money,
  netAmount: money,
  currency: z.string().nullish(),
  oldestEligibleAt: z.string().nullish(),
})

export const apiDuePayoutListSchema = z.array(apiDuePayoutSchema)

type ApiDuePayout = z.infer<typeof apiDuePayoutSchema>

export function normalizeDuePayout(raw: ApiDuePayout): PayoutDueItem {
  return {
    sellerId: raw.sellerId,
    sellerName: raw.sellerName,
    payoutAccountStatus: raw.payoutAccountStatus,
    settlementCount: raw.settlementCount,
    grossAmount: raw.grossAmount,
    refundedAmount: raw.refundedAmount,
    feeAmount: raw.feeAmount,
    stripeFeeAmount: raw.stripeFeeAmount,
    refundFeeAmount: raw.refundFeeAmount,
    chargebackAmount: raw.chargebackAmount,
    netAmount: raw.netAmount,
    currency: raw.currency ?? undefined,
    oldestEligibleAt: raw.oldestEligibleAt ?? undefined,
  }
}
