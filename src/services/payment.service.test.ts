import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { PaymentService } from "./payment.service"
import type { CreatePaymentIntentDTO } from "@/src/types"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

const dto: CreatePaymentIntentDTO = { orderId: "ord_1" } as unknown as CreatePaymentIntentDTO

describe("PaymentService", () => {
  beforeEach(() => vi.clearAllMocks())

  describe("createIntent", () => {
    it("POSTs the DTO to /api/v1/payments/create-intent", async () => {
      mockApiRequest.mockResolvedValue({ clientSecret: "cs_1" })
      await PaymentService.createIntent(dto)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/payments/create-intent", {
        method: "POST",
        body: JSON.stringify(dto),
      })
    })

    it("returns the unwrapped payment intent", async () => {
      const intent = { id: "pi_1", clientSecret: "cs_1", status: "requires_payment_method" }
      mockApiRequest.mockResolvedValue(intent)
      await expect(PaymentService.createIntent(dto)).resolves.toEqual(intent)
    })

    it("propagates a 429 rate-limit error unchanged", async () => {
      const err = Object.assign(new Error("Zu viele Anfragen"), { status: 429 })
      mockApiRequest.mockRejectedValue(err)
      await expect(PaymentService.createIntent(dto)).rejects.toMatchObject({ status: 429 })
    })
  })

  describe("getStatus", () => {
    it("GETs /api/v1/payments/{id}", async () => {
      mockApiRequest.mockResolvedValue({ status: "SUCCEEDED" })
      await PaymentService.getStatus("pi_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/payments/pi_1")
    })

    it("returns the unwrapped status response", async () => {
      const status = { paymentId: "pi_1", status: "SUCCEEDED" }
      mockApiRequest.mockResolvedValue(status)
      await expect(PaymentService.getStatus("pi_1")).resolves.toEqual(status)
    })

    it("propagates errors", async () => {
      mockApiRequest.mockRejectedValue(new Error("Not found"))
      await expect(PaymentService.getStatus("nope")).rejects.toThrow("Not found")
    })
  })
})
