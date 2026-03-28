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

const mockOrderDetail = {
  id: "ord_1",
  status: "PENDING",
  total: 59.99,
  items: [{ productId: "prod_1", quantity: 2, price: 29.99 }],
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
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/orders?page=1&size=20&status=PENDING"
      )
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
      mockApiRequest.mockResolvedValue(mockOrderDetail)
      await OrderService.getById("ord_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/orders/ord_1")
    })

    it("returns the order detail", async () => {
      mockApiRequest.mockResolvedValue(mockOrderDetail)
      const result = await OrderService.getById("ord_1")
      expect(result).toEqual(mockOrderDetail)
    })

    it("propagates errors from apiRequest", async () => {
      mockApiRequest.mockRejectedValue(new Error("Not found"))
      await expect(OrderService.getById("nonexistent")).rejects.toThrow("Not found")
    })
  })
})
