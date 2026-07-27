import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { CheckoutService } from "./checkout.service"
import type { CheckoutDTO } from "@/src/types"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

const dto: CheckoutDTO = {
  shippingAddressId: "addr_1",
  paymentMethod: "CARD",
} as unknown as CheckoutDTO

describe("CheckoutService", () => {
  beforeEach(() => vi.clearAllMocks())

  describe("preview", () => {
    it("POSTs the DTO to /api/v1/checkout", async () => {
      mockApiRequest.mockResolvedValue({ total: 42 })
      await CheckoutService.preview(dto)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/checkout", {
        method: "POST",
        body: JSON.stringify(dto),
      })
    })

    it("returns the unwrapped envelope data", async () => {
      const preview = { total: 42, items: [] }
      mockApiRequest.mockResolvedValue(preview)
      await expect(CheckoutService.preview(dto)).resolves.toEqual(preview)
    })

    it("propagates errors (e.g. 429 / validation)", async () => {
      mockApiRequest.mockRejectedValue(new Error("Zu viele Anfragen"))
      await expect(CheckoutService.preview(dto)).rejects.toThrow("Zu viele Anfragen")
    })
  })

  describe("complete", () => {
    it("POSTs the DTO to /api/v1/checkout/complete", async () => {
      mockApiRequest.mockResolvedValue({ orderId: "ord_1" })
      await CheckoutService.complete(dto)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/checkout/complete", {
        method: "POST",
        body: JSON.stringify(dto),
      })
    })

    it("returns the unwrapped envelope data", async () => {
      const result = { orderId: "ord_1", paymentIntentId: "pi_1" }
      mockApiRequest.mockResolvedValue(result)
      await expect(CheckoutService.complete(dto)).resolves.toEqual(result)
    })

    it("propagates errors from the money path", async () => {
      mockApiRequest.mockRejectedValue(new Error("Payment failed"))
      await expect(CheckoutService.complete(dto)).rejects.toThrow("Payment failed")
    })
  })
})
