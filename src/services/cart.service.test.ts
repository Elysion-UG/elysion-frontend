import { describe, it, expect, vi, beforeEach } from "vitest"
import { CartService } from "./cart.service"
import * as apiClient from "@/src/lib/api-client"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn() }
})

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

const apiCartItem = {
  id: "item-1",
  product: {
    id: "prod-1",
    slug: "my-shirt",
    name: "My Shirt",
    primaryImage: "https://example.com/img.jpg",
  },
  variant: {
    id: "var-L",
    sku: "SKU-L",
    options: [
      { type: "COLOR", value: "Rot" },
      { type: "SIZE", value: "L" },
    ],
  },
  quantity: 2,
  unitPrice: 29.9,
  currency: "EUR",
  lineTotal: 59.8,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

beforeEach(() => {
  mockApiRequest.mockReset()
  mockApiRequest.mockResolvedValue(emptyApiCart)
})

describe("CartService.addItem — backend API contract", () => {
  it("sends only variantId and quantity in the request body", async () => {
    mockApiRequest.mockResolvedValue(apiCartItem)
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
    mockApiRequest.mockResolvedValue(apiCartItem)
    await CartService.addItem({ productId: "prod-1", quantity: 1 })

    const [, options] = mockApiRequest.mock.calls[0]
    const body = JSON.parse(options.body as string)

    expect(body).toEqual({ quantity: 1 })
    expect(body).not.toHaveProperty("productId")
  })

  it("uses POST method for adding items", async () => {
    mockApiRequest.mockResolvedValue(apiCartItem)
    await CartService.addItem({ productId: "prod-1", variantId: "var-A", quantity: 1 })

    const [, options] = mockApiRequest.mock.calls[0]
    expect(options.method).toBe("POST")
  })

  it("targets the correct endpoint", async () => {
    mockApiRequest.mockResolvedValue(apiCartItem)
    await CartService.addItem({ productId: "prod-1", variantId: "var-A", quantity: 1 })

    const [url] = mockApiRequest.mock.calls[0]
    expect(url).toBe("/api/v1/cart/items")
  })

  // #188: the POST response is the affected line including its server id and full
  // display data. Discarding it was what made the local display cache a correctness
  // precondition — the returned line is the only place the real item id comes from.
  it("returns the persisted line with server id and display data", async () => {
    mockApiRequest.mockResolvedValue(apiCartItem)
    const item = await CartService.addItem({
      productId: "prod-1",
      variantId: "var-L",
      quantity: 2,
    })

    expect(item.id).toBe("item-1")
    expect(item.productId).toBe("prod-1")
    expect(item.productName).toBe("My Shirt")
    expect(item.productSlug).toBe("my-shirt")
    expect(item.imageUrl).toBe("https://example.com/img.jpg")
    expect(item.variantId).toBe("var-L")
    expect(item.variantSku).toBe("SKU-L")
    expect(item.priceSnapshot).toBe(29.9)
    expect(item.lineTotal).toBe(59.8)
    expect(item.currency).toBe("EUR")
  })

  it("returns the server-merged quantity, not the requested one", async () => {
    // Adding a variant already in the cart merges server-side into one line.
    mockApiRequest.mockResolvedValue({ ...apiCartItem, quantity: 7 })
    const item = await CartService.addItem({ productId: "prod-1", variantId: "var-L", quantity: 2 })

    expect(item.quantity).toBe(7)
  })

  it("throws on a drifted response instead of returning a half-empty line", async () => {
    mockApiRequest.mockResolvedValue({ ...apiCartItem, product: { id: "prod-1" } })

    await expect(CartService.addItem({ productId: "prod-1", quantity: 1 })).rejects.toThrowError()
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
      items: [apiCartItem],
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
          ...apiCartItem,
          id: "item-2",
          product: { id: "prod-2", slug: "no-img", name: "No Image", primaryImage: null },
          variant: null,
        },
      ],
    })

    const cart = await CartService.get()
    const item = cart.items[0]

    expect(item.imageUrl).toBeUndefined()
    expect(item.variantId).toBeUndefined()
    expect(item.variantOptions).toEqual([])
  })

  it("accepts currency: null on an empty cart", async () => {
    // Contract: `currency` is null while the cart is empty.
    mockApiRequest.mockResolvedValue({ ...emptyApiCart, currency: null })

    await expect(CartService.get()).resolves.toMatchObject({ items: [] })
  })
})

// #233 / #188: variant options are server-owned display data.
describe("CartService — variant options", () => {
  it("maps the backend { type, value } pairs to the rendered { name, value } shape", async () => {
    mockApiRequest.mockResolvedValue({ ...emptyApiCart, items: [apiCartItem] })

    const cart = await CartService.get()

    expect(cart.items[0].variantOptions).toEqual([
      { name: "COLOR", value: "Rot" },
      { name: "SIZE", value: "L" },
    ])
  })

  it("keeps the delivered option order (backend sorts by type, then value)", async () => {
    mockApiRequest.mockResolvedValue({
      ...emptyApiCart,
      items: [
        {
          ...apiCartItem,
          variant: {
            id: "var-L",
            sku: "SKU-L",
            options: [
              { type: "SIZE", value: "L" },
              { type: "color", value: "Rot" },
            ],
          },
        },
      ],
    })

    const cart = await CartService.get()

    expect(cart.items[0].variantOptions?.map((o) => o.name)).toEqual(["SIZE", "color"])
  })

  it("yields an empty list for a variant without options", async () => {
    mockApiRequest.mockResolvedValue({
      ...emptyApiCart,
      items: [{ ...apiCartItem, variant: { id: "var-L", sku: "SKU-L", options: [] } }],
    })

    const cart = await CartService.get()

    expect(cart.items[0].variantOptions).toEqual([])
  })

  it("tolerates a missing options field without failing the whole cart", async () => {
    // Options are decoration; an older backend instance during a rolling deploy
    // must not take name/image/price down with it.
    mockApiRequest.mockResolvedValue({
      ...emptyApiCart,
      items: [{ ...apiCartItem, variant: { id: "var-L", sku: "SKU-L" } }],
    })

    const cart = await CartService.get()

    expect(cart.items[0].productName).toBe("My Shirt")
    expect(cart.items[0].variantOptions).toEqual([])
  })

  it("rejects an option pair with a non-string value", async () => {
    mockApiRequest.mockResolvedValue({
      ...emptyApiCart,
      items: [
        {
          ...apiCartItem,
          variant: { id: "var-L", sku: "SKU-L", options: [{ type: "SIZE", value: 42 }] },
        },
      ],
    })

    await expect(CartService.get()).rejects.toThrowError()
  })
})

describe("CartService.updateItem", () => {
  it("sends quantity in the request body", async () => {
    mockApiRequest.mockResolvedValue(apiCartItem)
    await CartService.updateItem("item-123", { quantity: 5 })

    const [url, options] = mockApiRequest.mock.calls[0]
    const body = JSON.parse(options.body as string)

    expect(url).toBe("/api/v1/cart/items/item-123")
    expect(options.method).toBe("PATCH")
    expect(body).toEqual({ quantity: 5 })
  })

  it("returns the updated line (CartItemResponse), not the whole cart", async () => {
    mockApiRequest.mockResolvedValue({ ...apiCartItem, quantity: 3, lineTotal: 89.7 })
    const item = await CartService.updateItem("item-1", { quantity: 3 })

    expect(item.id).toBe("item-1")
    expect(item.quantity).toBe(3)
    expect(item.productName).toBe("My Shirt")
    expect(item).not.toHaveProperty("items")
  })

  it("throws on a drifted response", async () => {
    mockApiRequest.mockResolvedValue({ id: "item-1", quantity: 3 })

    await expect(CartService.updateItem("item-1", { quantity: 3 })).rejects.toThrowError()
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
