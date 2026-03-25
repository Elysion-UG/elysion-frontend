import { apiRequest } from "@/src/lib/api-client"
import type { PaymentIntent, PaymentStatusResponse, CreatePaymentIntentDTO } from "@/src/types"

export const PaymentService = {
  async createIntent(dto: CreatePaymentIntentDTO): Promise<PaymentIntent> {
    return apiRequest<PaymentIntent>("/api/v1/payments/create-intent", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async getStatus(paymentId: string): Promise<PaymentStatusResponse> {
    return apiRequest<PaymentStatusResponse>(`/api/v1/payments/${paymentId}`)
  },
}
