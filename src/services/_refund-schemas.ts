/**
 * Zod-Schema für die Antwort der beiden Erstattungs-Endpoints (#56).
 *
 * `POST /api/v1/seller/refunds` und `POST /api/v1/admin/refunds` teilen sich
 * exakt einen Request- und Response-Vertrag (Backend `docs/api/refunds.md`) —
 * das Schema liegt deshalb hier und nicht doppelt in den beiden Services.
 *
 * Validiert wird an der Boundary (`parseApiResponse`), nicht gecastet: Der
 * Rückgabewert enthält Geldbeträge und den Auszahlungsstand, und ein
 * umbenanntes Feld darf hier nicht still als `undefined` in die UI laufen (#38).
 */
import { z } from "zod"
import type { RefundResult } from "@/src/types"

export const refundStatusSchema = z.enum(["PENDING", "SUCCEEDED", "FAILED"])

export const refundInitiatorSchema = z.enum(["SELLER", "ADMIN"])

export const apiRefundResultSchema = z.object({
  refundId: z.string(),
  paymentId: z.string(),
  orderId: z.string(),
  orderGroupId: z.string(),
  sellerId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: refundStatusSchema,
  /** Stripe liefert die ID erst mit der Provider-Antwort — vorher `null`. */
  providerRefundId: z.string().nullish(),
  initiatedBy: refundInitiatorSchema,
  reason: z.string().nullish(),
  settlementRefundedAmount: z.number(),
  settlementRemainingRefundableAmount: z.number(),
  settlementPlatformFeeAmount: z.number(),
  settlementRefundFeeAmount: z.number(),
  /** Darf negativ sein: nach einer Vollerstattung bleibt die Ist-Gebühr stehen. */
  settlementNetAmount: z.number(),
  settlementAdjustmentRequired: z.boolean(),
})

type ApiRefundResult = z.infer<typeof apiRefundResultSchema>

/** Vereinheitlicht nur die beiden nullbaren Felder auf `null`. */
export function normalizeRefundResult(raw: ApiRefundResult): RefundResult {
  return {
    ...raw,
    providerRefundId: raw.providerRefundId ?? null,
    reason: raw.reason ?? null,
  }
}

/**
 * Baut den Request-Body. `amount` wird bei einer **Vollerstattung bewusst
 * weggelassen** — der Server erstattet dann den kompletten Restbetrag, was
 * gegen eine parallele Teilerstattung robuster ist als ein clientseitig
 * berechneter Betrag.
 */
export function buildRefundBody(dto: {
  orderGroupId: string
  amount?: number
  reason?: string
}): string {
  const reason = dto.reason?.trim()
  return JSON.stringify({
    orderGroupId: dto.orderGroupId,
    ...(dto.amount === undefined ? {} : { amount: dto.amount }),
    ...(reason ? { reason } : {}),
  })
}
