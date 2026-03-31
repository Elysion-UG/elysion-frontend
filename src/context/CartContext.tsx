"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { Cart, CartItem, AddToCartDTO } from "@/src/types"
import { CartService } from "@/src/services/cart.service"
import { useAuth } from "@/src/context/AuthContext"
import { saveProductDisplay, getProductDisplay } from "@/src/lib/product-display-cache"

interface CartContextValue {
  cart: Cart
  isLoading: boolean
  addItem: (dto: AddToCartDTO) => Promise<void>
  updateItem: (itemId: string, dto: { quantity: number }) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => void
  refetch: () => Promise<void>
  totalItems: number
  totalPrice: number
}

const emptyCart: Cart = { items: [] }
const GUEST_CART_KEY = "guest_cart"

// Ensures a cart object from the backend always has a defined items array.
// Also converts priceSnapshot (decimal EUR from backend) to unitPriceCents and
// enriches items with display data (name, image, slug) from the local cache so
// the cart renders correctly after backend sync.
function normalizeCart(data: Cart): Cart {
  const items = (data.items ?? []).map((item) => {
    const display = item.productId ? getProductDisplay(item.productId) : null
    return {
      ...item,
      unitPriceCents:
        item.unitPriceCents ??
        (item.priceSnapshot != null ? Math.round(item.priceSnapshot * 100) : undefined),
      productName: item.productName ?? display?.name,
      imageUrl: item.imageUrl ?? display?.imageUrl,
      productSlug: item.productSlug ?? display?.slug,
    }
  })
  return { ...data, items }
}

function loadGuestCart(): Cart {
  if (typeof window === "undefined") return emptyCart
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY)
    if (stored) return normalizeCart(JSON.parse(stored) as Cart)
  } catch {
    // ignore corrupt data
  }
  return emptyCart
}

function saveGuestCart(cart: Cart): void {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart))
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

function clearGuestCart(): void {
  try {
    localStorage.removeItem(GUEST_CART_KEY)
  } catch {}
}

export const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Lazily initialize from localStorage so the guest cart survives full-page
  // navigation (the <a href="/cart"> link causes a page reload, not a client-
  // side transition, which would otherwise reset React state).
  const [cart, setCart] = useState<Cart>(() => loadGuestCart())
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Sync cart with auth state:
  //   - authenticated  → fetch from backend, clear localStorage guest cart
  //   - unauthenticated (incl. after logout) → load from localStorage
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      // Reload from localStorage to pick up any pre-existing guest cart after
      // logout (localStorage will be empty if it was cleared on login).
      setCart(loadGuestCart())
      return
    }
    // Authenticated: backend is authoritative; drop the local guest cart.
    clearGuestCart()
    CartService.get()
      .then((data) => {
        if (data != null) setCart(normalizeCart(data))
      })
      .catch(() => {})
  }, [isAuthenticated, authLoading])

  // Persist guest cart to localStorage on every change so page reloads don't
  // wipe items for unauthenticated users.
  useEffect(() => {
    if (isAuthenticated) return
    saveGuestCart(cart)
  }, [cart, isAuthenticated])

  const addItem = useCallback(
    async (dto: AddToCartDTO) => {
      // Persist display metadata so the checkout page can show name + image
      // even after a full page reload (when the backend cart has no such fields).
      if (dto.productName) {
        saveProductDisplay(dto.productId, {
          name: dto.productName,
          imageUrl: dto.imageUrl,
          slug: dto.productSlug,
        })
      }

      // Optimistic update (always — guest and authenticated users alike)
      setCart((prev) => {
        const existingIdx = prev.items.findIndex(
          (i) => i.productId === dto.productId && i.variantId === dto.variantId
        )
        if (existingIdx >= 0) {
          const updated = prev.items.map((item, idx) =>
            idx === existingIdx ? { ...item, quantity: item.quantity + dto.quantity } : item
          )
          return { ...prev, items: updated }
        }
        const newItem: CartItem = {
          id: `${dto.productId}-${dto.variantId ?? "default"}-${Date.now()}`,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
          variantOptions: dto.variantOptions ?? [],
          productName: dto.productName,
          productSlug: dto.productSlug,
          imageUrl: dto.imageUrl,
          unitPriceCents: dto.unitPriceCents,
        }
        return { ...prev, items: [...prev.items, newItem] }
      })
      // Guest users: local-only cart, no backend sync
      if (!isAuthenticated) return
      // Sync with backend — POST returns CartItemResponse (single item), not the
      // full Cart. Optimistic update above is already correct, so we only await
      // the call to surface errors; we never overwrite state with the response.
      try {
        await CartService.addItem(dto)
      } catch (err) {
        // Revert optimistic update and re-throw so the caller can show an error
        setCart((prev) => ({
          ...prev,
          items: prev.items.filter(
            (i) => !(i.productId === dto.productId && i.variantId === dto.variantId)
          ),
        }))
        throw err
      }
    },
    [isAuthenticated]
  )

  const updateItem = useCallback(
    async (itemId: string, dto: { quantity: number }) => {
      // Capture previous quantity for rollback on backend error
      let previousQuantity: number | undefined
      setCart((prev) => {
        const item = prev.items.find((i) => i.id === itemId)
        previousQuantity = item?.quantity
        return prev
      })

      // Optimistic update
      if (dto.quantity <= 0) {
        setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }))
      } else {
        setCart((prev) => ({
          ...prev,
          items: prev.items.map((i) => (i.id === itemId ? { ...i, quantity: dto.quantity } : i)),
        }))
      }
      // Guest users: local-only cart, no backend sync
      if (!isAuthenticated) return
      // Sync with backend — PATCH returns CartItemResponse (single item), not the
      // full Cart. On failure, revert the optimistic update and re-throw so the
      // caller (Cart.tsx) can show an error toast.
      try {
        await CartService.updateItem(itemId, dto)
      } catch (err) {
        // Revert to previous quantity
        if (previousQuantity !== undefined) {
          setCart((prev) => ({
            ...prev,
            items: prev.items.map((i) =>
              i.id === itemId ? { ...i, quantity: previousQuantity! } : i
            ),
          }))
        }
        throw err
      }
    },
    [isAuthenticated]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      // Optimistic update
      setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }))
      // Guest users: local-only cart, no backend sync
      if (!isAuthenticated) return
      // Sync with backend
      try {
        await CartService.removeItem(itemId)
      } catch {
        // keep optimistic state on failure
      }
    },
    [isAuthenticated]
  )

  const clearCart = useCallback(() => {
    setCart(emptyCart)
  }, [])

  const refetch = useCallback(async () => {
    try {
      const updated = await CartService.get()
      if (updated != null) setCart(normalizeCart(updated))
    } catch {
      // ignore errors
    }
  }, [])

  const totalItems = (cart.items ?? []).reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = (cart.items ?? []).reduce(
    (sum, i) => sum + (i.unitPriceCents != null ? (i.unitPriceCents * i.quantity) / 100 : 0),
    0
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refetch,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
