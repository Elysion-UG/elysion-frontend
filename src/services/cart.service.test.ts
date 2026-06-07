import { describe, it, expect, vi, beforeEach } from "vitest"
import { CartService } from "./cart.service"
import * as apiClient from "@/src/lib/api-client"

vi.mock("@/src/lib/api-client", () => ({
  apiRequest: vi.fn(),
}))

const mockApiRequest = apiClient.apiRequest as ReturnType<typeof vi.fn>

const emptyApiCart = {
  id: "cart-1",
  ownershipType: "AUTHENTICATED",
  totalQuantity: 0,
  subtotal: 0,
  currency: "EUR",
  items: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

beforeEach(() => {
  mockApiRequest.mockReset()
  mockApiRequest.mockResolvedValue(emptyApiCart)
})

describe("CartService.addItem — backend API contract", () => {
  it("sends only variantId and quantity in the request body", async () => {
    mockApiRequest.mockResolvedValue(undefined)
    await CartService.addItem({
      productId: "prod-1",
      variantId: "var-XL",
      quantity: 2,
      productName: "Bio-Shirt",
      imageUrl: "https://example.com/img.jpg",
      productSlug: "bio-shirt",
      unitPriceCents: 2999,
    })

    expect(mockApiRequest).toHaveBeenCalledTimes(1)
    const [, options] = mockApiRequest.mock.calls[0]
    const body = JSON.parse(options.body as string)

    expect(body).toEqual({ variantId: "var-XL", quantity: 2 })
    expect(body).not.toHaveProperty("productId")
    expect(body).not.toHaveProperty("productName")
    expect(body).not.toHaveProperty("imageUrl")
    expect(body).not.toHaveProperty("productSlug")
    expect(body).not.toHaveProperty("unitPriceCents")
  })

  it("sends variantId as undefined when not provided", async () => {
    mockApiRequest.mockResolvedValue(undefined)
    await CartService.addItem({ productId: "prod-1", quantity: 1 })

    const [, options] = mockApiRequest.mock.calls[0]
    const body = JSON.parse(options.body as string)

    expect(body).toEqual({ quantity: 1 })
    expect(body).not.toHaveProperty("productId")
  })

  it("uses POST method for adding items", async () => {
    mockApiRequest.mockResolvedValue(undefined)
    await CartService.addItem({ productId: "prod-1", variantId: "var-A", quantity: 1 })

    const [, options] = mockApiRequest.mock.calls[0]
    expect(options.method).toBe("POST")
  })

  it("targets the correct endpoint", async () => {
    mockApiRequest.mockResolvedValue(undefined)
    await CartService.addItem({ productId: "prod-1", variantId: "var-A", quantity: 1 })

    const [url] = mockApiRequest.mock.calls[0]
    expect(url).toBe("/api/v1/cart/items")
  })
})

describe("CartService.get", () => {
  it("calls GET /api/v1/cart", async () => {
    await CartService.get()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/cart")
  })

  it("normalizes nested product/variant fields to flat CartItem fields", async () => {
    mockApiRequest.mockResolvedValue({
      ...emptyApiCart,
      id: "cart-abc",
      subtotal: 29.9,
      items: [
        {
          id: "item-1",
          product: {
            id: "prod-1",
            slug: "my-shirt",
            name: "My Shirt",
            primaryImage: "https://example.com/img.jpg",
          },
          variant: { id: "var-L", sku: "SKU-L" },
          quantity: 2,
          unitPrice: 29.9,
          currency: "EUR",
          lineTotal: 59.8,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    })

    const cart = await CartService.get()

    expect(cart.id).toBe("cart-abc")
    expect(cart.totalAmount).toBe(29.9)
    expect(cart.items).toHaveLength(1)
    const item = cart.items[0]
    expect(item.productId).toBe("prod-1")
    expect(item.productName).toBe("My Shirt")
    expect(item.productSlug).toBe("my-shirt")
    expect(item.imageUrl).toBe("https://example.com/img.jpg")
    expect(item.variantId).toBe("var-L")
    expect(item.priceSnapshot).toBe(29.9)
    expect(item.quantity).toBe(2)
  })

  it("handles null primaryImage and missing variant", async () => {
    mockApiRequest.mockResolvedValue({
      ...emptyApiCart,
      items: [
        {
          id: "item-2",
          product: { id: "prod-2", slug: "no-img", name: "No Image", primaryImage: null },
          variant: null,
          quantity: 1,
          unitPrice: 10,
          currency: "EUR",
          lineTotal: 10,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    })

    const cart = await CartService.get()
    const item = cart.items[0]

    expect(item.imageUrl).toBeUndefined()
    expect(item.variantId).toBeUndefined()
  })
})

describe("CartService.updateItem", () => {
  it("sends quantity in the request body", async () => {
    mockApiRequest.mockResolvedValue(undefined)
    await CartService.updateItem("item-123", { quantity: 5 })

    const [url, options] = mockApiRequest.mock.calls[0]
    const body = JSON.parse(options.body as string)

    expect(url).toBe("/api/v1/cart/items/item-123")
    expect(options.method).toBe("PATCH")
    expect(body).toEqual({ quantity: 5 })
  })

  it("returns void (backend returns CartItemResponse, not full Cart)", async () => {
    // Backend PATCH returns a single CartItemResponse. The service must NOT return
    // it as a Cart — callers rely on void so they don't accidentally wipe cart state.
    mockApiRequest.mockResolvedValue(undefined)
    const result = await CartService.updateItem("item-1", { quantity: 3 })
    expect(result).toBeUndefined()
  })
})

describe("CartService.removeItem", () => {
  it("calls DELETE on the correct item endpoint", async () => {
    mockApiRequest.mockResolvedValue(undefined)
    await CartService.removeItem("item-456")

    const [url, options] = mockApiRequest.mock.calls[0]
    expect(url).toBe("/api/v1/cart/items/item-456")
    expect(options.method).toBe("DELETE")
  })
})
