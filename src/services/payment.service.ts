/**
 * PaymentService — Zahlungserzeugung und Zahlungsstatus zur eigenen Bestellung.
 *
 * Endpunkte (BE `docs/api/payments.md`):
 *   POST /api/v1/payments/create-intent → PaymentIntentResponse
 *   GET  /api/v1/payments/{paymentId}   → PaymentStatusResponse
 *
 * Beträge und Währung stammen laut Vertrag immer aus der persistierten
 * Bestellung, nie aus vom Client geschickten Geldwerten.
 */
import { z } from "zod"
import { apiRequest } from "@/src/lib/api-client"
import { errorStore } from "@/src/lib/error-store"
import { parseApiResponse, paymentProviderCodeSchema } from "@/src/lib/api-schemas"
import type { PaymentIntent, PaymentStatusResponse, CreatePaymentIntentDTO } from "@/src/types"

// ── Raw backend schemas ───────────────────────────────────────────────
// Zod spiegelt `PaymentIntentResponse` / `PaymentStatusResponse` aus
// `api/v1/payments/dto/`. Validierung an der Grenze, damit ein fehlendes
// `clientSecret` oder ein umbenanntes Betragsfeld nicht erst im Stripe-Widget
// als leerer Zustand auffällt (#38).

const apiPaymentIntentSchema = z.object({
  paymentId: z.string(),
  orderId: z.string(),
  provider: paymentProviderCodeSchema,
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  // Provider-abhängig; das Record wird auch ohne die beiden Felder gebaut.
  clientSecret: z.string().nullable(),
  providerPaymentId: z.string().nullable(),
})

const apiPaymentStatusSchema = z.object({
  paymentId: z.string(),
  orderId: z.string(),
  provider: paymentProviderCodeSchema,
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  receiptUrl: z.string().nullish(),
  createdAt: z.string(),
  succeededAt: z.string().nullish(),
  failedAt: z.string().nullish(),
})

/**
 * Bekannte Zahlungsstatus des Backends (`domain/order/PaymentStatus`).
 *
 * Bewusst weich verengt: ein zusätzlicher Statuswert ist eine additive
 * Backend-Änderung und darf die Zahlungsseite nicht abschießen. Der unbekannte
 * Wert wird gemeldet und wie `PENDING` behandelt — die Statusabfrage pollt dann
 * weiter, statt einen Abbruch zu behaupten.
 */
const knownPaymentStatusSchema = z.enum([
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
])

function parsePaymentStatus(raw: string): PaymentStatusResponse["status"] {
  const result = knownPaymentStatusSchema.safeParse(raw)
  if (result.success) return result.data
  errorStore.report({
    severity: "low",
    category: "api",
    message: `[payment.service] unknown payment status from backend: ${raw}`,
  })
  return "PENDING"
}

export const PaymentService = {
  async createIntent(dto: CreatePaymentIntentDTO): Promise<PaymentIntent> {
    const raw = await apiRequest<unknown>("/api/v1/payments/create-intent", {
      method: "POST",
      body: JSON.stringify(dto),
    })
    const intent = parseApiResponse(apiPaymentIntentSchema, raw, "payment.createIntent")
    return { ...intent, status: parsePaymentStatus(intent.status) }
  },

  async getStatus(paymentId: string): Promise<PaymentStatusResponse> {
    const raw = await apiRequest<unknown>(`/api/v1/payments/${paymentId}`)
    const status = parseApiResponse(apiPaymentStatusSchema, raw, "payment.getStatus")
    return {
      paymentId: status.paymentId,
      orderId: status.orderId,
      provider: status.provider,
      amount: status.amount,
      currency: status.currency,
      status: parsePaymentStatus(status.status),
      receiptUrl: status.receiptUrl ?? undefined,
      createdAt: status.createdAt,
      succeededAt: status.succeededAt ?? undefined,
      failedAt: status.failedAt ?? undefined,
    }
  },
}
