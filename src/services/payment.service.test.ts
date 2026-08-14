import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { PaymentService } from "./payment.service"
import type { CreatePaymentIntentDTO } from "@/src/types"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

vi.mock("@/src/lib/error-store", () => ({ errorStore: { report: vi.fn() } }))

const mockApiRequest = vi.mocked(apiRequest)

const dto: CreatePaymentIntentDTO = { orderId: "ord_1", provider: "STRIPE" }

/** Raw shape as returned by the backend — `PaymentIntentResponse`. */
const rawIntent = {
  paymentId: "pay_1",
  orderId: "ord_1",
  provider: "STRIPE",
  amount: 59.98,
  currency: "EUR",
  status: "PENDING",
  clientSecret: "cs_1",
  providerPaymentId: "pi_1",
}

/** Raw shape as returned by the backend — `PaymentStatusResponse`. */
const rawStatus = {
  paymentId: "pay_1",
  orderId: "ord_1",
  provider: "STRIPE",
  amount: 59.98,
  currency: "EUR",
  status: "SUCCEEDED",
  receiptUrl: "https://stripe.example/receipt",
  createdAt: "2026-01-01T10:00:00Z",
  succeededAt: "2026-01-01T10:00:05Z",
  failedAt: null,
}

describe("PaymentService", () => {
  beforeEach(() => vi.clearAllMocks())

  describe("createIntent", () => {
    it("POSTs the DTO to /api/v1/payments/create-intent", async () => {
      mockApiRequest.mockResolvedValue(rawIntent)
      await PaymentService.createIntent(dto)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/payments/create-intent", {
        method: "POST",
        body: JSON.stringify(dto),
      })
    })

    it("returns the validated payment intent", async () => {
      mockApiRequest.mockResolvedValue(rawIntent)
      await expect(PaymentService.createIntent(dto)).resolves.toEqual(rawIntent)
    })

    it("accepts an intent without a client secret", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawIntent,
        clientSecret: null,
        providerPaymentId: null,
      })
      const intent = await PaymentService.createIntent(dto)
      expect(intent.clientSecret).toBeNull()
    })

    it("throws when the amount is missing — the money path must not render blank", async () => {
      const { amount: _amount, ...drifted } = rawIntent
      mockApiRequest.mockResolvedValue(drifted)
      await expect(PaymentService.createIntent(dto)).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("throws on an unknown payment provider (contract drift, #38)", async () => {
      mockApiRequest.mockResolvedValue({ ...rawIntent, provider: "BITCOIN" })
      await expect(PaymentService.createIntent(dto)).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("propagates a 429 rate-limit error unchanged", async () => {
      const err = Object.assign(new Error("Zu viele Anfragen"), { status: 429 })
      mockApiRequest.mockRejectedValue(err)
      await expect(PaymentService.createIntent(dto)).rejects.toMatchObject({ status: 429 })
    })
  })

  describe("getStatus", () => {
    it("GETs /api/v1/payments/{id}", async () => {
      mockApiRequest.mockResolvedValue(rawStatus)
      await PaymentService.getStatus("pay_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/payments/pay_1")
    })

    it("returns the validated status response with nulls normalised to undefined", async () => {
      mockApiRequest.mockResolvedValue(rawStatus)
      const status = await PaymentService.getStatus("pay_1")
      expect(status.status).toBe("SUCCEEDED")
      expect(status.succeededAt).toBe("2026-01-01T10:00:05Z")
      expect(status.failedAt).toBeUndefined()
    })

    it("treats an unknown status as PENDING so polling continues", async () => {
      mockApiRequest.mockResolvedValue({ ...rawStatus, status: "CHARGEBACK_PENDING" })
      const status = await PaymentService.getStatus("pay_1")
      expect(status.status).toBe("PENDING")
    })

    it("throws when the status field disappears", async () => {
      const { status: _status, ...drifted } = rawStatus
      mockApiRequest.mockResolvedValue(drifted)
      await expect(PaymentService.getStatus("pay_1")).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("propagates errors", async () => {
      mockApiRequest.mockRejectedValue(new Error("Not found"))
      await expect(PaymentService.getStatus("nope")).rejects.toThrow("Not found")
    })
  })
})
