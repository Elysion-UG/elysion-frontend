import { apiRequest } from "@/src/lib/api-client"
import type { CheckoutDTO, CheckoutStartResponse, CheckoutCompleteResponse } from "@/src/types"

export const CheckoutService = {
  async preview(dto: CheckoutDTO): Promise<CheckoutStartResponse> {
    return apiRequest<CheckoutStartResponse>("/api/v1/checkout", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async complete(dto: CheckoutDTO): Promise<CheckoutCompleteResponse> {
    return apiRequest<CheckoutCompleteResponse>("/api/v1/checkout/complete", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },
}
