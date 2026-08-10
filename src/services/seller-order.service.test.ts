import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { SellerOrderService } from "./seller-order.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

const rawGroup = {
  id: "grp_1",
  orderId: "ord_1",
  status: "PROCESSING",
  total: 55.0,
  currency: "EUR",
  shipment: null,
  buyer: { userId: "buyer_1" },
  createdAt: "2026-01-01T10:00:00Z",
  items: [
    {
      id: "item_1",
      quantity: 2,
      unitPrice: 27.5,
      lineTotal: 55.0,
      product: { id: "prod_1", name: "Eco Shirt", slug: "eco-shirt", seller: { id: "seller_1" } },
    },
  ],
}

describe("SellerOrderService", () => {
  beforeEach(() => vi.clearAllMocks())

  describe("list", () => {
    it("requests /api/v1/seller/orders without a query string when no params", async () => {
      mockApiRequest.mockResolvedValue({
        items: [],
        page: 0,
        size: 20,
        totalItems: 0,
        totalPages: 0,
      })
      await SellerOrderService.list()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/orders")
    })

    it("appends page/size/status params", async () => {
      mockApiRequest.mockResolvedValue({
        items: [],
        page: 1,
        size: 5,
        totalItems: 0,
        totalPages: 0,
      })
      await SellerOrderService.list({ page: 1, size: 5, status: "SHIPPED" })
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/seller/orders?page=1&size=5&status=SHIPPED"
      )
    })

    it("normalizes each group in the page", async () => {
      mockApiRequest.mockResolvedValue({
        items: [rawGroup],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      })
      const page = await SellerOrderService.list()
      const group = page.items[0]
      expect(group.orderGroupId).toBe("grp_1")
      expect(group.totalAmount).toBe(55.0)
      expect(group.items[0].pricePerUnit).toBe(27.5)
      expect(group.items[0].subtotal).toBe(55.0)
      expect(group.items[0].productSnapshot?.productName).toBe("Eco Shirt")
      expect(group.items[0].productSnapshot?.sellerId).toBe("seller_1")
    })
  })

  describe("getById", () => {
    it("GETs and normalizes a single group", async () => {
      mockApiRequest.mockResolvedValue(rawGroup)
      const group = await SellerOrderService.getById("grp_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/orders/grp_1")
      expect(group.orderGroupId).toBe("grp_1")
      expect(group.orderId).toBe("ord_1")
    })
  })

  describe("mutations", () => {
    it("updateStatus PATCHes the status body", async () => {
      mockApiRequest.mockResolvedValue(rawGroup)
      await SellerOrderService.updateStatus("grp_1", "SHIPPED")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/orders/grp_1/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "SHIPPED" }),
      })
    })

    it("ship POSTs the ship DTO", async () => {
      mockApiRequest.mockResolvedValue(rawGroup)
      const dto = { trackingNumber: "TN1", carrier: "DHL" } as Parameters<
        typeof SellerOrderService.ship
      >[1]
      await SellerOrderService.ship("grp_1", dto)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/orders/grp_1/ship", {
        method: "POST",
        body: JSON.stringify(dto),
      })
    })

    it("deliver POSTs an empty body", async () => {
      mockApiRequest.mockResolvedValue(rawGroup)
      await SellerOrderService.deliver("grp_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/orders/grp_1/deliver", {
        method: "POST",
        body: JSON.stringify({}),
      })
    })
  })

  describe("shippingSla (#143)", () => {
    it("carries the server SLA through the normalizer", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawGroup,
        shippingSla: {
          status: "BREACHED",
          deadlineAt: "2026-01-03T10:00:00Z",
          breachedAt: "2026-01-03T10:05:00Z",
        },
      })
      const group = await SellerOrderService.getById("grp_1")
      expect(group.shippingSla).toEqual({
        status: "BREACHED",
        deadlineAt: "2026-01-03T10:00:00Z",
        breachedAt: "2026-01-03T10:05:00Z",
      })
    })

    it("normalizes missing timestamps to null instead of undefined", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawGroup,
        shippingSla: { status: "NOT_APPLICABLE", deadlineAt: null, breachedAt: null },
      })
      const group = await SellerOrderService.getById("grp_1")
      expect(group.shippingSla).toEqual({
        status: "NOT_APPLICABLE",
        deadlineAt: null,
        breachedAt: null,
      })
    })

    it("accepts an order group without an SLA (predates #143)", async () => {
      mockApiRequest.mockResolvedValue(rawGroup)
      const group = await SellerOrderService.getById("grp_1")
      expect(group.shippingSla).toBeUndefined()
    })

    it("rejects an unknown SLA status instead of casting it through", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawGroup,
        shippingSla: { status: "ESCALATED", deadlineAt: null, breachedAt: null },
      })
      await expect(SellerOrderService.getById("grp_1")).rejects.toThrow(/Ungültige Server-Antwort/)
    })
  })

  it("keeps subtotal and shipping alongside the total", async () => {
    mockApiRequest.mockResolvedValue({ ...rawGroup, subtotal: 50.0, shipping: 5.0 })
    const group = await SellerOrderService.getById("grp_1")
    expect(group.subtotal).toBe(50.0)
    expect(group.shipping).toBe(5.0)
    expect(group.totalAmount).toBe(55.0)
  })

  it("listSettlements GETs /api/v1/seller/settlements", async () => {
    mockApiRequest.mockResolvedValue([])
    await SellerOrderService.listSettlements()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/settlements")
  })

  describe("refund", () => {
    const rawRefund = {
      refundId: "ref_1",
      paymentId: "pay_1",
      orderId: "ord_1",
      orderGroupId: "grp_1",
      sellerId: "seller_1",
      amount: 24.9,
      currency: "EUR",
      status: "SUCCEEDED",
      providerRefundId: "re_stripe_1",
      initiatedBy: "SELLER",
      reason: "Retoure",
      settlementRefundedAmount: 24.9,
      settlementRemainingRefundableAmount: 30.1,
      settlementPlatformFeeAmount: 2.5,
      settlementRefundFeeAmount: 0.4,
      settlementNetAmount: 27.2,
      settlementAdjustmentRequired: true,
    }

    it("POSTs /api/v1/seller/refunds and maps the settlement effect", async () => {
      mockApiRequest.mockResolvedValue(rawRefund)

      const result = await SellerOrderService.refund({
        orderGroupId: "grp_1",
        amount: 24.9,
        reason: "Retoure",
      })

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/seller/refunds",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ orderGroupId: "grp_1", amount: 24.9, reason: "Retoure" }),
        })
      )
      expect(result.amount).toBe(24.9)
      expect(result.initiatedBy).toBe("SELLER")
      expect(result.settlementRemainingRefundableAmount).toBe(30.1)
      expect(result.settlementAdjustmentRequired).toBe(true)
    })

    it("omits amount entirely for a full refund", async () => {
      mockApiRequest.mockResolvedValue(rawRefund)

      await SellerOrderService.refund({ orderGroupId: "grp_1" })

      const body = mockApiRequest.mock.calls[0][1]?.body as string
      expect(JSON.parse(body)).toEqual({ orderGroupId: "grp_1" })
    })

    it("drops a blank reason instead of sending an empty string", async () => {
      mockApiRequest.mockResolvedValue(rawRefund)

      await SellerOrderService.refund({ orderGroupId: "grp_1", reason: "   " })

      const body = mockApiRequest.mock.calls[0][1]?.body as string
      expect(JSON.parse(body)).toEqual({ orderGroupId: "grp_1" })
    })

    it("normalises a missing providerRefundId and reason to null", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawRefund,
        providerRefundId: null,
        reason: null,
        status: "PENDING",
      })

      const result = await SellerOrderService.refund({ orderGroupId: "grp_1" })

      expect(result.providerRefundId).toBeNull()
      expect(result.reason).toBeNull()
      expect(result.status).toBe("PENDING")
    })

    it("rejects an unknown refund status instead of casting it through", async () => {
      mockApiRequest.mockResolvedValue({ ...rawRefund, status: "REVERSED" })

      await expect(SellerOrderService.refund({ orderGroupId: "grp_1" })).rejects.toThrow(
        /Ungültige Server-Antwort/
      )
    })

    it("rejects a response missing the settlement effect", async () => {
      const { settlementNetAmount: _omitted, ...withoutNet } = rawRefund
      mockApiRequest.mockResolvedValue(withoutNet)

      await expect(SellerOrderService.refund({ orderGroupId: "grp_1" })).rejects.toThrow(
        /Ungültige Server-Antwort/
      )
    })
  })
})
