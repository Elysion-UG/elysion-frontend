"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import type { Cart, CartItem, AddToCartDTO } from "@/src/types"
import { CartService } from "@/src/services/cart.service"
import { useAuth } from "@/src/context/AuthContext"
import {
  saveProductDisplay,
  getProductDisplay,
  saveVariantOptions,
  getVariantOptions,
} from "@/src/lib/product-display-cache"

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
      variantOptions:
        (item.variantOptions?.length ?? 0) > 0
          ? item.variantOptions
          : item.variantId
            ? (getVariantOptions(item.variantId) ?? item.variantOptions)
            : item.variantOptions,
    }
  })
  return { ...data, items }
}

export const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart)
  const [isInitializing, setIsInitializing] = useState(true)
  const { isAuthenticated, isLoading: authLoading, role } = useAuth()

  // Only BUYER users (customer portal) have a backend cart.
  // Seller/Admin tokens are bound to a different portal and would get 403.
  const isCustomerPortal = role === "BUYER" || role === null

  // One-time cleanup: remove legacy localStorage guest cart from before the
  // backend-sync migration. Harmless if the key doesn't exist.
  useEffect(() => {
    try {
      localStorage.removeItem("guest_cart")
    } catch {
      // localStorage may be unavailable (private mode, SSR); safe to ignore.
    }
  }, [])

  // Sync cart with backend on auth state changes:
  //   - guest (unauthenticated) → backend resolves via cartSessionId cookie
  //   - authenticated customer → backend resolves via Authorization header
  //   - authenticated seller/admin → no cart (skip fetch)
  useEffect(() => {
    if (authLoading) return

    if (isAuthenticated && !isCustomerPortal) {
      setCart(emptyCart)
      setIsInitializing(false)
      return
    }

    setIsInitializing(true)
    CartService.get()
      .then((data) => {
        if (data != null) setCart(normalizeCart(data))
      })
      .catch(() => {
        setCart(emptyCart)
      })
      .finally(() => setIsInitializing(false))
  }, [isAuthenticated, authLoading, isCustomerPortal])

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
      if (dto.variantId && dto.variantOptions?.length) {
        saveVariantOptions(dto.variantId, dto.variantOptions)
      }

      // Snapshot previous state for rollback before any optimistic mutation
      const prevCart = cart

      // Optimistic update
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

      // Sync with backend
      try {
        await CartService.addItem(dto)
      } catch (err) {
        setCart(prevCart)
        throw err
      }
    },
    [cart]
  )

  const updateItem = useCallback(
    async (itemId: string, dto: { quantity: number }) => {
      const prevCart = cart

      // Optimistic update
      if (dto.quantity <= 0) {
        setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }))
      } else {
        setCart((prev) => ({
          ...prev,
          items: prev.items.map((i) => (i.id === itemId ? { ...i, quantity: dto.quantity } : i)),
        }))
      }

      // Sync with backend
      try {
        await CartService.updateItem(itemId, dto)
      } catch (err) {
        setCart(prevCart)
        throw err
      }
    },
    [cart]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      const prevCart = cart
      // Optimistic update
      setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }))
      // Sync with backend
      try {
        await CartService.removeItem(itemId)
      } catch (err) {
        setCart(prevCart)
        toast.error("Artikel konnte nicht entfernt werden.")
        throw err
      }
    },
    [cart]
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
        isLoading: isInitializing,
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
