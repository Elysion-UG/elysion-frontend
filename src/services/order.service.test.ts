import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { OrderService } from "./order.service"

vi.mock("@/src/lib/api-client", () => ({
  apiRequest: vi.fn(),
  apiRequestRaw: vi.fn(),
  apiUpload: vi.fn(),
}))

const mockApiRequest = vi.mocked(apiRequest)

const mockOrders = [
  { id: "ord_1", status: "PENDING", total: 59.99 },
  { id: "ord_2", status: "SHIPPED", total: 29.99 },
]

/** Raw shape as returned by the backend */
const rawOrderDetail = {
  id: "ord_1",
  orderNumber: "ORD-001",
  status: "PENDING",
  total: 59.99,
  subtotal: 55.0,
  shipping: 4.99,
  tax: null,
  createdAt: "2026-01-01T10:00:00Z",
  shippingAddress: {
    firstName: "Max",
    lastName: "Mustermann",
    street: "Musterstraße",
    houseNumber: "1",
    postalCode: "12345",
    city: "Berlin",
    country: "DE",
  },
  groups: [
    {
      id: "grp_1",
      seller: { id: "seller-uuid" },
      status: "PENDING",
      subtotal: 55.0,
      shipping: 4.99,
      shipment: null,
      items: [
        {
          id: "item_1",
          variantId: "var_1",
          quantity: 2,
          unitPrice: 27.5,
          lineTotal: 55.0,
          product: {
            id: "prod-uuid",
            name: "Eco Shirt",
            slug: "eco-shirt",
            seller: { id: "seller-uuid" },
            variantId: "var_1",
            sku: "SKU-L",
            options: [{ type: "Größe", value: "L" }],
            currency: "EUR",
          },
        },
      ],
    },
  ],
}

describe("OrderService", () => {
  beforeEach(() => vi.clearAllMocks())

  // ── list ─────────────────────────────────────────────────────────────

  describe("list", () => {
    it("calls /api/v1/orders with no query string when no params given", async () => {
      mockApiRequest.mockResolvedValue(mockOrders)
      await OrderService.list()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders")
    })

    it("appends page param", async () => {
      mockApiRequest.mockResolvedValue(mockOrders)
      await OrderService.list({ page: 2 })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders?page=2")
    })

    it("appends size param", async () => {
      mockApiRequest.mockResolvedValue(mockOrders)
      await OrderService.list({ size: 5 })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders?size=5")
    })

    it("appends status param", async () => {
      mockApiRequest.mockResolvedValue(mockOrders)
      await OrderService.list({ status: "SHIPPED" })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders?status=SHIPPED")
    })

    it("appends all params together", async () => {
      mockApiRequest.mockResolvedValue(mockOrders)
      await OrderService.list({ page: 1, size: 20, status: "PENDING" })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders?page=1&size=20&status=PENDING")
    })

    it("omits undefined page and size", async () => {
      mockApiRequest.mockResolvedValue(mockOrders)
      await OrderService.list({ status: "DELIVERED" })
      const url = mockApiRequest.mock.calls[0][0] as string
      expect(url).not.toContain("page")
      expect(url).not.toContain("size")
      expect(url).toContain("status=DELIVERED")
    })

    it("returns the orders array", async () => {
      mockApiRequest.mockResolvedValue(mockOrders)
      const result = await OrderService.list()
      expect(result).toEqual(mockOrders)
    })
  })

  // ── getById ──────────────────────────────────────────────────────────

  describe("getById", () => {
    it("calls /api/v1/orders/{id}", async () => {
      mockApiRequest.mockResolvedValue(rawOrderDetail)
      await OrderService.getById("ord_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders/ord_1")
    })

    it("maps product → productSnapshot with id→productId, name→productName, slug→productSlug", async () => {
      mockApiRequest.mockResolvedValue(rawOrderDetail)
      const result = await OrderService.getById("ord_1")
      const snap = result.groups?.[0].items[0].productSnapshot
      expect(snap?.productId).toBe("prod-uuid")
      expect(snap?.productName).toBe("Eco Shirt")
      expect(snap?.productSlug).toBe("eco-shirt")
    })

    it("maps seller.id → sellerId on productSnapshot", async () => {
      mockApiRequest.mockResolvedValue(rawOrderDetail)
      const result = await OrderService.getById("ord_1")
      expect(result.groups?.[0].items[0].productSnapshot?.sellerId).toBe("seller-uuid")
    })

    it("maps unitPrice → pricePerUnit and lineTotal → subtotal on items", async () => {
      mockApiRequest.mockResolvedValue(rawOrderDetail)
      const result = await OrderService.getById("ord_1")
      const item = result.groups?.[0].items[0]
      expect(item?.pricePerUnit).toBe(27.5)
      expect(item?.subtotal).toBe(55.0)
    })

    it("maps shipping → shippingCost on order", async () => {
      mockApiRequest.mockResolvedValue(rawOrderDetail)
      const result = await OrderService.getById("ord_1")
      expect(result.shippingCost).toBe(4.99)
    })

    it("maps seller.id → sellerId on group", async () => {
      mockApiRequest.mockResolvedValue(rawOrderDetail)
      const result = await OrderService.getById("ord_1")
      expect(result.groups?.[0].sellerId).toBe("seller-uuid")
    })

    it("maps shipping → shippingCost on group", async () => {
      mockApiRequest.mockResolvedValue(rawOrderDetail)
      const result = await OrderService.getById("ord_1")
      expect(result.groups?.[0].shippingCost).toBe(4.99)
    })

    it("passes through item options", async () => {
      mockApiRequest.mockResolvedValue(rawOrderDetail)
      const result = await OrderService.getById("ord_1")
      expect(result.groups?.[0].items[0].productSnapshot?.options).toEqual([
        { type: "Größe", value: "L" },
      ])
    })

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValue(new Error("Not found"))
      await expect(OrderService.getById("nonexistent")).rejects.toThrow("Not found")
    })
  })
})
