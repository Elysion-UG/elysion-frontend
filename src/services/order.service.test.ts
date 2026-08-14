import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { OrderService } from "./order.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

vi.mock("@/src/lib/error-store", () => ({ errorStore: { report: vi.fn() } }))

const mockApiRequest = vi.mocked(apiRequest)

/**
 * Raw shape as returned by the backend — `PagedResponse<OrderSummaryResponse>`.
 * Das war vorher eine nackte Liste im Test und hat damit den seit der
 * Umstellung auf `data.items` geltenden Vertrag nicht abgebildet.
 */
const rawOrderPage = {
  items: [
    {
      id: "ord_1",
      orderNumber: "ORD-001",
      status: "PENDING",
      paymentStatus: "PENDING",
      total: 59.99,
      currency: "EUR",
      createdAt: "2026-01-01T10:00:00Z",
    },
    {
      id: "ord_2",
      orderNumber: "ORD-002",
      status: "SHIPPED",
      paymentStatus: "SUCCEEDED",
      total: 29.99,
      currency: "EUR",
      createdAt: "2026-01-02T10:00:00Z",
    },
  ],
  page: 0,
  size: 20,
  totalItems: 2,
  totalPages: 1,
}

/** Raw shape as returned by the backend — `OrderDetailResponse`. */
const rawOrderDetail = {
  id: "ord_1",
  orderNumber: "ORD-001",
  guestEmail: null,
  status: "PENDING",
  paymentStatus: "PENDING",
  subtotal: 55.0,
  shipping: 4.99,
  tax: null,
  total: 59.99,
  currency: "EUR",
  createdAt: "2026-01-01T10:00:00Z",
  updatedAt: "2026-01-01T10:00:00Z",
  billingAddress: null,
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
      createdAt: "2026-01-01T10:00:00Z",
      updatedAt: "2026-01-01T10:00:00Z",
      items: [
        {
          id: "item_1",
          quantity: 2,
          unitPrice: 27.5,
          lineTotal: 55.0,
          currency: "EUR",
          createdAt: "2026-01-01T10:00:00Z",
          updatedAt: "2026-01-01T10:00:00Z",
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
      mockApiRequest.mockResolvedValue(rawOrderPage)
      await OrderService.list()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders")
    })

    it("appends page param", async () => {
      mockApiRequest.mockResolvedValue(rawOrderPage)
      await OrderService.list({ page: 2 })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders?page=2")
    })

    it("appends size param", async () => {
      mockApiRequest.mockResolvedValue(rawOrderPage)
      await OrderService.list({ size: 5 })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders?size=5")
    })

    it("appends status param", async () => {
      mockApiRequest.mockResolvedValue(rawOrderPage)
      await OrderService.list({ status: "SHIPPED" })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders?status=SHIPPED")
    })

    it("appends all params together", async () => {
      mockApiRequest.mockResolvedValue(rawOrderPage)
      await OrderService.list({ page: 1, size: 20, status: "PENDING" })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders?page=1&size=20&status=PENDING")
    })

    it("omits undefined page and size", async () => {
      mockApiRequest.mockResolvedValue(rawOrderPage)
      await OrderService.list({ status: "DELIVERED" })
      const url = mockApiRequest.mock.calls[0][0] as string
      expect(url).not.toContain("page")
      expect(url).not.toContain("size")
      expect(url).toContain("status=DELIVERED")
    })

    it("reads the rows from data.items", async () => {
      mockApiRequest.mockResolvedValue(rawOrderPage)
      const result = await OrderService.list()
      expect(result.map((o) => o.id)).toEqual(["ord_1", "ord_2"])
      expect(result[0].total).toBe(59.99)
      expect(result[0].orderNumber).toBe("ORD-001")
    })

    it("narrows an unknown order status to PENDING instead of feeding it to the label map", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawOrderPage,
        items: [{ ...rawOrderPage.items[0], status: "AWAITING_ALIEN_APPROVAL" }],
      })
      const result = await OrderService.list()
      expect(result[0].status).toBe("PENDING")
    })

    it("throws on a bare list — the contract paginates (data.items)", async () => {
      mockApiRequest.mockResolvedValue(rawOrderPage.items)
      await expect(OrderService.list()).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("throws when a row loses its money field", async () => {
      const { total: _total, ...withoutTotal } = rawOrderPage.items[0]
      mockApiRequest.mockResolvedValue({ ...rawOrderPage, items: [withoutTotal] })
      await expect(OrderService.list()).rejects.toThrow(/Ungültige Server-Antwort/)
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

    it("takes variantId from the frozen snapshot — the line itself carries none", async () => {
      mockApiRequest.mockResolvedValue(rawOrderDetail)
      const result = await OrderService.getById("ord_1")
      expect(result.groups?.[0].items[0].variantId).toBe("var_1")
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

    it("accepts a delivered shipment without tracking data", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawOrderDetail,
        groups: [
          {
            ...rawOrderDetail.groups[0],
            shipment: {
              trackingNumber: null,
              carrier: null,
              shippedAt: null,
              deliveredAt: "2026-01-05T10:00:00Z",
            },
          },
        ],
      })
      const result = await OrderService.getById("ord_1")
      expect(result.groups?.[0].shipment).toEqual({ trackingNumber: null, carrier: undefined })
    })

    it("accepts an order snapshot whose optional fields arrive as null", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawOrderDetail,
        groups: [
          {
            ...rawOrderDetail.groups[0],
            items: [
              {
                ...rawOrderDetail.groups[0].items[0],
                product: {
                  id: "prod-uuid",
                  name: "Eco Shirt",
                  slug: "eco-shirt",
                  seller: { id: null },
                  variantId: null,
                  sku: null,
                  options: [],
                  currency: null,
                },
              },
            ],
          },
        ],
      })
      const result = await OrderService.getById("ord_1")
      const snap = result.groups?.[0].items[0].productSnapshot
      expect(snap?.productName).toBe("Eco Shirt")
      expect(snap?.sku).toBeUndefined()
      expect(snap?.sellerId).toBeUndefined()
    })

    it("narrows an unknown order-group status to PENDING", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawOrderDetail,
        groups: [{ ...rawOrderDetail.groups[0], status: "TELEPORTED" }],
      })
      const result = await OrderService.getById("ord_1")
      expect(result.groups?.[0].status).toBe("PENDING")
    })

    it("throws when the line-total field is renamed (contract drift, #38)", async () => {
      const { lineTotal: _lineTotal, ...drifted } = rawOrderDetail.groups[0].items[0]
      mockApiRequest.mockResolvedValue({
        ...rawOrderDetail,
        groups: [{ ...rawOrderDetail.groups[0], items: [{ ...drifted, subtotal: 55.0 }] }],
      })
      await expect(OrderService.getById("ord_1")).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("throws when the order loses its shipping address", async () => {
      const { shippingAddress: _addr, ...withoutAddress } = rawOrderDetail
      mockApiRequest.mockResolvedValue(withoutAddress)
      await expect(OrderService.getById("ord_1")).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValue(new Error("Not found"))
      await expect(OrderService.getById("nonexistent")).rejects.toThrow("Not found")
    })
  })
})
