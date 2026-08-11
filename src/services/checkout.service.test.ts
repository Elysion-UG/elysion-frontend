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
  paymentMethod: "STRIPE",
}

const address = {
  firstName: "Max",
  lastName: "Mustermann",
  street: "Musterstraße",
  houseNumber: "1",
  postalCode: "12345",
  city: "Berlin",
  country: "DE",
}

/** Raw shape as returned by the backend — `CheckoutStartResponse`. */
const rawStart = {
  cartId: "cart_1",
  ownershipType: "AUTHENTICATED",
  totalQuantity: 2,
  subtotal: 59.98,
  currency: "EUR",
  items: [
    {
      id: "cart-item-1",
      product: {
        id: "prod-1",
        slug: "eco-shirt",
        name: "Eco Shirt",
        primaryImage: "https://cdn.example/eco.jpg",
      },
      variant: {
        id: "var-1",
        sku: "SKU-L",
        options: [
          { type: "COLOR", value: "Rot" },
          { type: "SIZE", value: "L" },
        ],
      },
      quantity: 2,
      unitPrice: 29.99,
      lineTotal: 59.98,
      currency: "EUR",
    },
  ],
  shippingAddress: address,
  billingAddress: address,
}

/** Raw shape as returned by the backend — `CheckoutCompleteResponse`. */
const rawComplete = {
  orderId: "ord_1",
  orderNumber: "ORD-001",
  orderStatus: "PENDING",
  paymentStatus: "PENDING",
  paymentMethod: "STRIPE",
  completedAt: "2026-01-01T10:00:00Z",
  // Auf der Abschluss-Antwort ist `id` die Order-Item-Id und `primaryImage`
  // laut Vertrag immer null.
  checkout: {
    ...rawStart,
    items: [
      {
        ...rawStart.items[0],
        id: "order-item-1",
        product: { ...rawStart.items[0].product, primaryImage: null },
      },
    ],
  },
}

describe("CheckoutService", () => {
  beforeEach(() => vi.clearAllMocks())

  describe("preview", () => {
    it("POSTs the DTO to /api/v1/checkout", async () => {
      mockApiRequest.mockResolvedValue(rawStart)
      await CheckoutService.preview(dto)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/checkout", {
        method: "POST",
        body: JSON.stringify(dto),
      })
    })

    it("returns the validated snapshot with server-owned display data", async () => {
      mockApiRequest.mockResolvedValue(rawStart)
      const preview = await CheckoutService.preview(dto)
      expect(preview.items[0].product.name).toBe("Eco Shirt")
      expect(preview.items[0].product.primaryImage).toBe("https://cdn.example/eco.jpg")
      expect(preview.items[0].variant.options).toEqual([
        { type: "COLOR", value: "Rot" },
        { type: "SIZE", value: "L" },
      ])
      expect(preview.subtotal).toBe(59.98)
    })

    it("normalises missing variant options to an empty list", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawStart,
        items: [{ ...rawStart.items[0], variant: { id: "var-1", sku: "SKU-L" } }],
      })
      const preview = await CheckoutService.preview(dto)
      expect(preview.items[0].variant.options).toEqual([])
    })

    it("throws when a line loses its money field (contract drift, #38)", async () => {
      const { lineTotal: _lineTotal, ...drifted } = rawStart.items[0]
      mockApiRequest.mockResolvedValue({ ...rawStart, items: [drifted] })
      await expect(CheckoutService.preview(dto)).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("throws when the resolved shipping address is missing", async () => {
      const { shippingAddress: _addr, ...withoutAddress } = rawStart
      mockApiRequest.mockResolvedValue(withoutAddress)
      await expect(CheckoutService.preview(dto)).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("throws on a broken option pair", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawStart,
        items: [
          {
            ...rawStart.items[0],
            variant: { id: "var-1", sku: "SKU-L", options: [{ type: "COLOR" }] },
          },
        ],
      })
      await expect(CheckoutService.preview(dto)).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("propagates errors (e.g. 429 / validation)", async () => {
      mockApiRequest.mockRejectedValue(new Error("Zu viele Anfragen"))
      await expect(CheckoutService.preview(dto)).rejects.toThrow("Zu viele Anfragen")
    })
  })

  describe("complete", () => {
    it("POSTs the DTO to /api/v1/checkout/complete", async () => {
      mockApiRequest.mockResolvedValue(rawComplete)
      await CheckoutService.complete(dto)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/checkout/complete", {
        method: "POST",
        body: JSON.stringify(dto),
      })
    })

    it("returns the created order plus the nested validated snapshot", async () => {
      mockApiRequest.mockResolvedValue(rawComplete)
      const result = await CheckoutService.complete(dto)
      expect(result.orderId).toBe("ord_1")
      expect(result.orderNumber).toBe("ORD-001")
      expect(result.checkout.subtotal).toBe(59.98)
      // Der eingefrorene Bestell-Snapshot trägt kein Bild.
      expect(result.checkout.items[0].product.primaryImage).toBeNull()
      // `id` ist hier die Order-Item-Id, nicht die Cart-Item-Id.
      expect(result.checkout.items[0].id).toBe("order-item-1")
    })

    it("throws when the nested checkout snapshot is missing (contract drift, #38)", async () => {
      const { checkout: _checkout, ...withoutCheckout } = rawComplete
      mockApiRequest.mockResolvedValue(withoutCheckout)
      await expect(CheckoutService.complete(dto)).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("throws when orderId is missing — the payment step reads it", async () => {
      const { orderId: _orderId, ...withoutOrderId } = rawComplete
      mockApiRequest.mockResolvedValue(withoutOrderId)
      await expect(CheckoutService.complete(dto)).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("propagates errors from the money path", async () => {
      mockApiRequest.mockRejectedValue(new Error("Payment failed"))
      await expect(CheckoutService.complete(dto)).rejects.toThrow("Payment failed")
    })
  })
})
