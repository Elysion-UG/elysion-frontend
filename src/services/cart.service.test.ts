import { describe, it, expect, vi, beforeEach } from "vitest"
import { CartService } from "./cart.service"
import * as apiClient from "@/src/lib/api-client"

vi.mock("@/src/lib/api-client", () => ({
  apiRequest: vi.fn(),
}))

const mockApiRequest = apiClient.apiRequest as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockApiRequest.mockReset()
  mockApiRequest.mockResolvedValue({ items: [] })
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
