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

  it("listSettlements GETs /api/v1/seller/settlements", async () => {
    mockApiRequest.mockResolvedValue([])
    await SellerOrderService.listSettlements()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/settlements")
  })
})
