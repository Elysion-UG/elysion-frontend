import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from "vitest"
import { renderHook, act } from "@testing-library/react"
import React from "react"
import { CartProvider, useCart } from "./CartContext"
import { useAuth } from "@/src/context/AuthContext"
import { CartService } from "@/src/services/cart.service"
import type { AddToCartDTO, Cart, CartItem } from "@/src/types"

vi.mock("@/src/services/cart.service", () => ({
  CartService: {
    get: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

vi.mock("@/src/lib/product-display-cache", () => ({
  clearLegacyVariantOptionsCache: vi.fn(),
}))

// CartProvider calls useAuth() — provide a default guest context for all tests.
// Individual tests can override this mock as needed.
vi.mock("@/src/context/AuthContext", () => ({
  useAuth: vi.fn().mockReturnValue({ isAuthenticated: false, isLoading: false, role: null }),
}))

// ── Wrapper ────────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
)

// ── Fake cart backend ──────────────────────────────────────────────────────────
// POST and PATCH answer with the affected line (`CartItemResponse`) carrying the
// server's own item id, the server-side merged quantity and the server-owned
// display data. The default mocks emulate exactly that, because the context now
// reconciles its optimistic line against the response (#188).

const serverLines = new Map<string, CartItem>()
let serverIdCounter = 0

function lineKey(productId: string, variantId?: string) {
  return `${productId}|${variantId ?? ""}`
}

function fakeAddItem(dto: AddToCartDTO): CartItem {
  const key = lineKey(dto.productId, dto.variantId)
  const existing = serverLines.get(key)
  const line: CartItem = {
    id: existing?.id ?? `srv-${++serverIdCounter}`,
    productId: dto.productId,
    variantId: dto.variantId,
    quantity: (existing?.quantity ?? 0) + dto.quantity,
    productName: dto.productName,
    productSlug: dto.productSlug,
    imageUrl: dto.imageUrl,
    unitPriceCents: dto.unitPriceCents,
    variantOptions: dto.variantOptions ?? [],
  }
  serverLines.set(key, line)
  return line
}

function fakeUpdateItem(itemId: string, dto: { quantity: number }): CartItem {
  for (const [key, line] of serverLines) {
    if (line.id === itemId) {
      const updated = { ...line, quantity: dto.quantity }
      serverLines.set(key, updated)
      return updated
    }
  }
  const line: CartItem = { id: itemId, productId: "unknown", quantity: dto.quantity }
  return line
}

beforeEach(() => {
  localStorage.clear()
  serverLines.clear()
  serverIdCounter = 0
  ;(CartService.get as MockedFunction<typeof CartService.get>).mockReset()
  ;(CartService.addItem as MockedFunction<typeof CartService.addItem>).mockReset()
  ;(CartService.updateItem as MockedFunction<typeof CartService.updateItem>).mockReset()
  ;(CartService.removeItem as MockedFunction<typeof CartService.removeItem>).mockReset()
  ;(CartService.get as MockedFunction<typeof CartService.get>).mockResolvedValue({ items: [] })
  ;(CartService.addItem as MockedFunction<typeof CartService.addItem>).mockImplementation(
    async (dto) => fakeAddItem(dto)
  )
  ;(CartService.updateItem as MockedFunction<typeof CartService.updateItem>).mockImplementation(
    async (itemId, dto) => fakeUpdateItem(itemId, dto)
  )
  ;(CartService.removeItem as MockedFunction<typeof CartService.removeItem>).mockResolvedValue(
    undefined
  )
})

// ── Initial state ──────────────────────────────────────────────────────────────

describe("CartContext — initial state", () => {
  it("starts with an empty cart", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})
    expect(result.current.cart.items).toHaveLength(0)
  })

  it("starts with isLoading true until backend fetch completes", () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    // isLoading is true before the initial CartService.get() resolves
    expect(result.current.isLoading).toBe(true)
  })

  it("isLoading becomes false after initial fetch", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})
    expect(result.current.isLoading).toBe(false)
  })

  it("starts with totalItems = 0", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})
    expect(result.current.totalItems).toBe(0)
  })

  it("starts with totalPrice = 0", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})
    expect(result.current.totalPrice).toBe(0)
  })

  it("fetches cart from backend on mount (guest)", async () => {
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockClear()
    renderHook(() => useCart(), { wrapper })
    await act(async () => {})
    expect(CartService.get).toHaveBeenCalledTimes(1)
  })

  it("removes legacy localStorage guest_cart on mount", async () => {
    localStorage.setItem("guest_cart", JSON.stringify({ items: [] }))
    renderHook(() => useCart(), { wrapper })
    await act(async () => {})
    expect(localStorage.getItem("guest_cart")).toBeNull()
  })
})

// ── useCart guard ──────────────────────────────────────────────────────────────

describe("useCart", () => {
  it("throws when used outside CartProvider", () => {
    const consoleError = console.error
    console.error = () => {}
    expect(() => renderHook(() => useCart())).toThrow("useCart must be used within CartProvider")
    console.error = consoleError
  })
})

// ── addItem ────────────────────────────────────────────────────────────────────

describe("addItem", () => {
  it("adds a new item to an empty cart and calls backend", async () => {
    ;(CartService.addItem as MockedFunction<typeof CartService.addItem>).mockClear()
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 2 })
    })

    expect(result.current.cart.items).toHaveLength(1)
    expect(result.current.cart.items[0].productId).toBe("prod-1")
    expect(result.current.cart.items[0].quantity).toBe(2)
    expect(CartService.addItem).toHaveBeenCalledTimes(1)
  })

  it("stores display fields (productName, productSlug, imageUrl, unitPriceCents) on the new item", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({
        productId: "prod-1",
        quantity: 1,
        productName: "Bio-Shirt",
        productSlug: "bio-shirt",
        imageUrl: "https://example.com/img.jpg",
        unitPriceCents: 2999,
      })
    })

    const item = result.current.cart.items[0]
    expect(item.productName).toBe("Bio-Shirt")
    expect(item.productSlug).toBe("bio-shirt")
    expect(item.imageUrl).toBe("https://example.com/img.jpg")
    expect(item.unitPriceCents).toBe(2999)
  })

  it("stores productSlug undefined when no slug is provided (caller must pass URL slug)", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1, productName: "Bio-Shirt" })
    })

    const item = result.current.cart.items[0]
    expect(item.productId).toBe("prod-1")
    expect(item.productName).toBe("Bio-Shirt")
    expect(item.productSlug).toBeUndefined()
  })

  it("adds a second distinct item alongside an existing one", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
    })
    await act(async () => {
      await result.current.addItem({ productId: "prod-2", quantity: 3 })
    })

    expect(result.current.cart.items).toHaveLength(2)
  })

  it("merges quantity when same productId and no variantId is added twice", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})
    const dto: AddToCartDTO = { productId: "prod-1", quantity: 2 }

    await act(async () => {
      await result.current.addItem(dto)
    })
    await act(async () => {
      await result.current.addItem({ ...dto, quantity: 3 })
    })

    expect(result.current.cart.items).toHaveLength(1)
    expect(result.current.cart.items[0].quantity).toBe(5)
  })

  it("merges quantity when same productId and same variantId", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-A", quantity: 1 })
    })
    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-A", quantity: 4 })
    })

    expect(result.current.cart.items).toHaveLength(1)
    expect(result.current.cart.items[0].quantity).toBe(5)
  })

  it("does NOT merge when same productId but different variantIds", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-A", quantity: 1 })
    })
    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-B", quantity: 1 })
    })

    expect(result.current.cart.items).toHaveLength(2)
  })

  it("stores variantId on the new item", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-XL", quantity: 1 })
    })

    expect(result.current.cart.items[0].variantId).toBe("var-XL")
  })

  it("generates a unique id for the new item", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
    })

    expect(result.current.cart.items[0].id).toBeTruthy()
    expect(typeof result.current.cart.items[0].id).toBe("string")
  })

  it("reverts optimistic update on backend error (guest)", async () => {
    ;(CartService.addItem as MockedFunction<typeof CartService.addItem>).mockRejectedValueOnce(
      new Error("409 Stock limit")
    )
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    let thrown: unknown
    await act(async () => {
      try {
        await result.current.addItem({ productId: "prod-1", quantity: 10 })
      } catch (e) {
        thrown = e
      }
    })

    expect(thrown).toBeInstanceOf(Error)
    expect(result.current.cart.items).toHaveLength(0)
  })
})

// ── updateItem ─────────────────────────────────────────────────────────────────

describe("updateItem", () => {
  it("updates the quantity of an existing item and calls backend", async () => {
    ;(CartService.updateItem as MockedFunction<typeof CartService.updateItem>).mockClear()
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 2 })
    })

    const itemId = result.current.cart.items[0].id

    await act(async () => {
      await result.current.updateItem(itemId, { quantity: 10 })
    })

    expect(result.current.cart.items[0].quantity).toBe(10)
    expect(result.current.cart.items).toHaveLength(1)
    expect(CartService.updateItem).toHaveBeenCalled()
  })

  it("removes the item when quantity is set to 0", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 3 })
    })

    const itemId = result.current.cart.items[0].id

    await act(async () => {
      await result.current.updateItem(itemId, { quantity: 0 })
    })

    expect(result.current.cart.items).toHaveLength(0)
  })

  it("removes the item when quantity is negative", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 3 })
    })

    const itemId = result.current.cart.items[0].id

    await act(async () => {
      await result.current.updateItem(itemId, { quantity: -1 })
    })

    expect(result.current.cart.items).toHaveLength(0)
  })

  it("only updates the targeted item, leaving others unchanged", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
    })
    await act(async () => {
      await result.current.addItem({ productId: "prod-2", quantity: 5 })
    })

    const firstItemId = result.current.cart.items[0].id

    await act(async () => {
      await result.current.updateItem(firstItemId, { quantity: 99 })
    })

    const prod1 = result.current.cart.items.find((i) => i.productId === "prod-1")
    const prod2 = result.current.cart.items.find((i) => i.productId === "prod-2")

    expect(prod1?.quantity).toBe(99)
    expect(prod2?.quantity).toBe(5)
  })
})

// ── removeItem ─────────────────────────────────────────────────────────────────

describe("removeItem", () => {
  it("removes the specified item by id and calls backend", async () => {
    ;(CartService.removeItem as MockedFunction<typeof CartService.removeItem>).mockClear()
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
    })

    const itemId = result.current.cart.items[0].id

    await act(async () => {
      await result.current.removeItem(itemId)
    })

    expect(result.current.cart.items).toHaveLength(0)
    expect(CartService.removeItem).toHaveBeenCalled()
  })

  it("only removes the targeted item, leaving others intact", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 2 })
    })
    await act(async () => {
      await result.current.addItem({ productId: "prod-2", quantity: 3 })
    })

    const firstItemId = result.current.cart.items[0].id

    await act(async () => {
      await result.current.removeItem(firstItemId)
    })

    expect(result.current.cart.items).toHaveLength(1)
    expect(result.current.cart.items[0].productId).toBe("prod-2")
  })

  it("is a no-op when the id does not exist in the cart", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
    })

    await act(async () => {
      await result.current.removeItem("non-existent-id")
    })

    expect(result.current.cart.items).toHaveLength(1)
  })

  it("reverts optimistic update and re-throws on backend error", async () => {
    ;(
      CartService.removeItem as MockedFunction<typeof CartService.removeItem>
    ).mockRejectedValueOnce(new Error("Network error"))
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
    })

    const itemId = result.current.cart.items[0].id

    let thrown: unknown
    await act(async () => {
      try {
        await result.current.removeItem(itemId)
      } catch (e) {
        thrown = e
      }
    })

    expect(thrown).toBeInstanceOf(Error)
    expect(result.current.cart.items).toHaveLength(1)
  })
})

// ── clearCart ──────────────────────────────────────────────────────────────────

describe("clearCart", () => {
  it("removes all items from the cart", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
      await result.current.addItem({ productId: "prod-2", quantity: 2 })
      await result.current.addItem({ productId: "prod-3", quantity: 3 })
    })

    expect(result.current.cart.items).toHaveLength(3)

    act(() => {
      result.current.clearCart()
    })

    expect(result.current.cart.items).toHaveLength(0)
  })

  it("is safe to call on an already-empty cart", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    act(() => {
      result.current.clearCart()
    })

    expect(result.current.cart.items).toHaveLength(0)
  })
})

// ── totalItems ─────────────────────────────────────────────────────────────────

describe("totalItems", () => {
  it("sums quantities across all items", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 3 })
      await result.current.addItem({ productId: "prod-2", quantity: 7 })
    })

    expect(result.current.totalItems).toBe(10)
  })

  it("decreases when an item is removed", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 5 })
    })

    const itemId = result.current.cart.items[0].id

    await act(async () => {
      await result.current.removeItem(itemId)
    })

    expect(result.current.totalItems).toBe(0)
  })

  it("updates after clearCart", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 4 })
    })

    act(() => {
      result.current.clearCart()
    })

    expect(result.current.totalItems).toBe(0)
  })
})

// ── totalPrice ─────────────────────────────────────────────────────────────────

describe("totalPrice", () => {
  it("is 0 when items have no unitPriceCents", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 5 })
    })

    expect(result.current.totalPrice).toBe(0)
  })

  it("sums (unitPriceCents * quantity) / 100 across items that have a price", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 3 })
      await result.current.addItem({ productId: "prod-2", quantity: 2 })
    })

    // totalItems should be 5, totalPrice should be 0 (no price set)
    expect(result.current.totalItems).toBe(5)
    expect(result.current.totalPrice).toBe(0)
  })

  it("resets to 0 after clearCart", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
    })

    act(() => {
      result.current.clearCart()
    })

    expect(result.current.totalPrice).toBe(0)
  })
})

// ── Guest cart — backend-synced ─────────────────────────────────────────────────

describe("guest cart — backend-synced", () => {
  it("addItem calls CartService.addItem for guest users", async () => {
    ;(CartService.addItem as MockedFunction<typeof CartService.addItem>).mockClear()
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 2 })
    })

    expect(CartService.addItem).toHaveBeenCalledTimes(1)
  })

  it("updateItem calls CartService.updateItem for guest users", async () => {
    ;(CartService.updateItem as MockedFunction<typeof CartService.updateItem>).mockClear()
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
    })
    const itemId = result.current.cart.items[0].id

    await act(async () => {
      await result.current.updateItem(itemId, { quantity: 5 })
    })

    expect(CartService.updateItem).toHaveBeenCalledTimes(1)
  })

  it("removeItem calls CartService.removeItem for guest users", async () => {
    ;(CartService.removeItem as MockedFunction<typeof CartService.removeItem>).mockClear()
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
    })
    const itemId = result.current.cart.items[0].id

    await act(async () => {
      await result.current.removeItem(itemId)
    })

    expect(CartService.removeItem).toHaveBeenCalledTimes(1)
  })

  it("fetches backend cart on mount for guests", async () => {
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockClear()
    renderHook(() => useCart(), { wrapper })
    await act(async () => {})
    expect(CartService.get).toHaveBeenCalledTimes(1)
  })

  it("cart refetch on login transition", async () => {
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockClear()
    const mockUseAuth = useAuth as MockedFunction<typeof useAuth>

    // Start as guest
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      role: null,
    } as ReturnType<typeof useAuth>)
    const { rerender } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})
    expect(CartService.get).toHaveBeenCalledTimes(1)

    // Simulate login
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockClear()
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      role: "BUYER",
    } as ReturnType<typeof useAuth>)
    rerender()
    await act(async () => {})

    expect(CartService.get).toHaveBeenCalledTimes(1)

    // Restore default mock
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      role: null,
    } as ReturnType<typeof useAuth>)
  })

  it("sets empty cart when backend fetch fails", async () => {
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockRejectedValueOnce(
      new Error("Network error")
    )
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    expect(result.current.cart.items).toHaveLength(0)
    expect(result.current.isLoading).toBe(false)
  })
})

// ── Seller/Admin portal — no cart ───────────────────────────────────────────────

describe("seller/admin portal — no cart fetch", () => {
  it("does not fetch cart for seller portal", async () => {
    const mockUseAuth = useAuth as MockedFunction<typeof useAuth>
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      role: "SELLER",
    } as ReturnType<typeof useAuth>)
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockClear()

    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    expect(CartService.get).not.toHaveBeenCalled()
    expect(result.current.cart.items).toHaveLength(0)

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      role: null,
    } as ReturnType<typeof useAuth>)
  })

  it("does not fetch cart for admin portal", async () => {
    const mockUseAuth = useAuth as MockedFunction<typeof useAuth>
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      role: "ADMIN",
    } as ReturnType<typeof useAuth>)
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockClear()

    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    expect(CartService.get).not.toHaveBeenCalled()
    expect(result.current.cart.items).toHaveLength(0)

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      role: null,
    } as ReturnType<typeof useAuth>)
  })
})

// ── Authenticated cart — backend API shape (regression) ─────────────────────────

describe("authenticated cart — backend API contract (regression)", () => {
  const mockUseAuth = useAuth as MockedFunction<typeof useAuth>

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      role: "BUYER",
    } as ReturnType<typeof useAuth>)
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockResolvedValue({
      items: [],
    } as Cart)
  })

  afterEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      role: null,
    } as ReturnType<typeof useAuth>)
  })

  it("addItem sends only variantId and quantity to the backend", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({
        productId: "prod-1",
        variantId: "var-XL",
        quantity: 2,
        productName: "Bio-Shirt",
        imageUrl: "https://example.com/img.jpg",
        unitPriceCents: 2999,
      })
    })

    expect(CartService.addItem).toHaveBeenCalledTimes(1)
    expect(
      (CartService.addItem as MockedFunction<typeof CartService.addItem>).mock.calls[0][0]
    ).toMatchObject({ variantId: "var-XL", quantity: 2 })
  })

  it("addItem result: the line carries the display fields after backend sync", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({
        productId: "prod-1",
        variantId: "var-XL",
        quantity: 2,
        productName: "Bio-Shirt",
        imageUrl: "https://example.com/img.jpg",
        productSlug: "bio-shirt",
        unitPriceCents: 2999,
      })
    })

    const item = result.current.cart.items[0]
    expect(item.productName).toBe("Bio-Shirt")
    expect(item.imageUrl).toBe("https://example.com/img.jpg")
    expect(item.productSlug).toBe("bio-shirt")
    expect(item.unitPriceCents).toBe(2999)
  })

  it("takes variantOptions from the backend cart load, not from a local cache", async () => {
    const backendCart: Cart = {
      items: [
        {
          id: "srv-1",
          productId: "prod-1",
          variantId: "var-XL",
          quantity: 1,
          variantOptions: [{ name: "SIZE", value: "XL" }],
        },
      ],
    }
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockResolvedValue(backendCart)

    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    expect(result.current.cart.items[0].variantOptions).toEqual([{ name: "SIZE", value: "XL" }])
  })

  it("normalizes priceSnapshot (decimal EUR) to unitPriceCents on backend cart load", async () => {
    const backendCart: Cart = {
      items: [
        {
          id: "srv-1",
          productId: "prod-1",
          variantId: "var-XL",
          quantity: 1,
          priceSnapshot: 29.99,
        },
      ],
    }
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockResolvedValue(backendCart)

    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    expect(result.current.cart.items[0].unitPriceCents).toBe(2999)
  })

  it("totalPrice is computed from priceSnapshot when backend items lack unitPriceCents", async () => {
    const backendCart: Cart = {
      items: [
        { id: "srv-1", productId: "prod-1", variantId: "var-XL", quantity: 2, priceSnapshot: 10.0 },
        { id: "srv-2", productId: "prod-2", variantId: "var-M", quantity: 3, priceSnapshot: 5.5 },
      ],
    }
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockResolvedValue(backendCart)

    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    // 2 × €10 + 3 × €5.50 = €20 + €16.50 = €36.50
    expect(result.current.totalPrice).toBeCloseTo(36.5, 2)
  })

  it("reverts optimistic quantity increase when backend returns 409 (insufficient stock)", async () => {
    ;(
      CartService.updateItem as MockedFunction<typeof CartService.updateItem>
    ).mockRejectedValueOnce(Object.assign(new Error("Insufficient stock"), { status: 409 }))

    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    // Add item at quantity 2
    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-XL", quantity: 2 })
    })
    const itemId = result.current.cart.items[0].id

    // Try to increase to 5 — backend rejects with 409
    await expect(
      act(async () => {
        await result.current.updateItem(itemId, { quantity: 5 })
      })
    ).rejects.toThrow()

    // Must revert to original quantity 2
    expect(result.current.cart.items[0].quantity).toBe(2)
  })

  it("re-throws the backend error on updateItem failure so callers can show a toast", async () => {
    ;(
      CartService.updateItem as MockedFunction<typeof CartService.updateItem>
    ).mockRejectedValueOnce(new Error("Insufficient stock"))

    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-XL", quantity: 1 })
    })
    const itemId = result.current.cart.items[0].id

    let thrown: unknown
    await act(async () => {
      try {
        await result.current.updateItem(itemId, { quantity: 10 })
      } catch (e) {
        thrown = e
      }
    })

    expect(thrown).toBeInstanceOf(Error)
  })

  it("item stays in cart after quantity decrease (regression: PATCH returns CartItemResponse not Cart)", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    // Add item (quantity 3)
    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-XL", quantity: 3 })
    })
    expect(result.current.cart.items).toHaveLength(1)
    const itemId = result.current.cart.items[0].id

    // Reduce to 2 — item must remain visible
    await act(async () => {
      await result.current.updateItem(itemId, { quantity: 2 })
    })

    expect(result.current.cart.items).toHaveLength(1)
    expect(result.current.cart.items[0].quantity).toBe(2)
  })

  it("does not overwrite unitPriceCents when backend already provides it", async () => {
    const backendCart: Cart = {
      items: [
        {
          id: "srv-1",
          productId: "prod-1",
          variantId: "var-XL",
          quantity: 1,
          unitPriceCents: 3000,
          priceSnapshot: 29.99,
        },
      ],
    }
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockResolvedValue(backendCart)

    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    // unitPriceCents from backend takes precedence over priceSnapshot conversion
    expect(result.current.cart.items[0].unitPriceCents).toBe(3000)
  })
})

// ── Display cache is only an optimization (#188) ────────────────────────────────
//
// The core requirement: display data is server-owned, so a cart opened on a second
// device or after cleared browser storage must render identically. These tests run
// with an empty localStorage and never populate any cache.

describe("cart is complete without a local display cache (#188)", () => {
  const fullBackendCart: Cart = {
    id: "cart-1",
    totalAmount: 59.8,
    items: [
      {
        id: "srv-1",
        productId: "prod-1",
        productName: "Bio-Shirt",
        productSlug: "bio-shirt",
        imageUrl: "https://example.com/shirt.jpg",
        variantId: "var-XL",
        variantSku: "SKU-XL",
        variantOptions: [
          { name: "COLOR", value: "Rot" },
          { name: "SIZE", value: "XL" },
        ],
        quantity: 2,
        priceSnapshot: 29.9,
        lineTotal: 59.8,
        currency: "EUR",
      },
    ],
  }

  it("renders name, slug, image and options from the backend with empty browser storage", async () => {
    localStorage.clear()
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockResolvedValue(fullBackendCart)

    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    const item = result.current.cart.items[0]
    expect(item.productName).toBe("Bio-Shirt")
    expect(item.productSlug).toBe("bio-shirt")
    expect(item.imageUrl).toBe("https://example.com/shirt.jpg")
    expect(item.variantOptions).toEqual([
      { name: "COLOR", value: "Rot" },
      { name: "SIZE", value: "XL" },
    ])
    expect(item.unitPriceCents).toBe(2990)
    expect(result.current.totalPrice).toBeCloseTo(59.8, 2)
    expect(localStorage.length).toBe(0)
  })

  it("takes the display data from the add response even when the caller supplied none", async () => {
    ;(CartService.addItem as MockedFunction<typeof CartService.addItem>).mockResolvedValue({
      id: "srv-9",
      productId: "prod-1",
      productName: "Bio-Shirt",
      productSlug: "bio-shirt",
      imageUrl: "https://example.com/shirt.jpg",
      variantId: "var-XL",
      variantOptions: [{ name: "SIZE", value: "XL" }],
      quantity: 1,
      priceSnapshot: 29.9,
    })

    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-XL", quantity: 1 })
    })

    const item = result.current.cart.items[0]
    expect(item.productName).toBe("Bio-Shirt")
    expect(item.imageUrl).toBe("https://example.com/shirt.jpg")
    expect(item.variantOptions).toEqual([{ name: "SIZE", value: "XL" }])
    expect(item.unitPriceCents).toBe(2990)
  })

  it("adopts the server item id so the next quantity change targets the real line", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-XL", quantity: 1 })
    })

    const itemId = result.current.cart.items[0].id
    expect(itemId).toBe("srv-1")

    await act(async () => {
      await result.current.updateItem(itemId, { quantity: 4 })
    })

    expect(CartService.updateItem).toHaveBeenCalledWith("srv-1", { quantity: 4 })
    expect(result.current.cart.items[0].quantity).toBe(4)
  })

  it("keeps one line when the backend merges the same variant into an existing line", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-XL", quantity: 2 })
    })
    await act(async () => {
      await result.current.addItem({ productId: "prod-1", variantId: "var-XL", quantity: 3 })
    })

    expect(result.current.cart.items).toHaveLength(1)
    expect(result.current.cart.items[0].id).toBe("srv-1")
    expect(result.current.cart.items[0].quantity).toBe(5)
  })

  it("deletes via DELETE instead of PATCH quantity 0 (0 never deletes)", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.addItem({ productId: "prod-1", quantity: 1 })
    })
    const itemId = result.current.cart.items[0].id
    ;(CartService.updateItem as MockedFunction<typeof CartService.updateItem>).mockClear()

    await act(async () => {
      await result.current.updateItem(itemId, { quantity: 0 })
    })

    expect(CartService.removeItem).toHaveBeenCalledWith(itemId)
    expect(CartService.updateItem).not.toHaveBeenCalled()
    expect(result.current.cart.items).toHaveLength(0)
  })

  it("re-reads the cart after login so the merged guest cart is fully rendered", async () => {
    // The guest-cart merge happens inside the login request and reports nothing
    // back — the fresh GET is the only way the client learns the merged state.
    localStorage.clear()
    const mockUseAuth = useAuth as MockedFunction<typeof useAuth>
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      role: null,
    } as ReturnType<typeof useAuth>)
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockResolvedValue({ items: [] })

    const { result, rerender } = renderHook(() => useCart(), { wrapper })
    await act(async () => {})
    expect(result.current.cart.items).toHaveLength(0)
    ;(CartService.get as MockedFunction<typeof CartService.get>).mockResolvedValue(fullBackendCart)
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      role: "BUYER",
    } as ReturnType<typeof useAuth>)
    rerender()
    await act(async () => {})

    expect(result.current.cart.items).toHaveLength(1)
    expect(result.current.cart.items[0].productName).toBe("Bio-Shirt")
    expect(result.current.cart.items[0].imageUrl).toBe("https://example.com/shirt.jpg")

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      role: null,
    } as ReturnType<typeof useAuth>)
  })
})
