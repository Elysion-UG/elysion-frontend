"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"
import { toast } from "sonner"
import type { Cart, CartItem, AddToCartDTO } from "@/src/types"
import { CartService } from "@/src/services/cart.service"
import { useAuth } from "@/src/context/AuthContext"
import { clearLegacyVariantOptionsCache } from "@/src/lib/product-display-cache"

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

// Converts priceSnapshot (decimal EUR from the backend) to unitPriceCents.
//
// Display data (name, image, slug, variant options) is NOT reconstructed here:
// it is server-owned and delivered by every cart route — the read as well as
// add and update (BE docs/api/cart.md, "Display Data Is Server-Owned", #188).
// A cart opened on a second device or after cleared browser storage therefore
// renders identically; there is no local display cache in this path any more.
function normalizeItem(item: CartItem): CartItem {
  return {
    ...item,
    unitPriceCents:
      item.unitPriceCents ??
      (item.priceSnapshot != null ? Math.round(item.priceSnapshot * 100) : undefined),
  }
}

// Ensures a cart object from the backend always has a defined items array.
function normalizeCart(data: Cart): Cart {
  return { ...data, items: (data.items ?? []).map(normalizeItem) }
}

// Replaces the optimistic line with the line the server actually persisted.
//
// Two reasons this is mandatory, not cosmetic:
//   1. the optimistic line carries a client-generated id; only the server id is
//      accepted by PATCH/DELETE — without this swap the next quantity change on
//      a freshly added item hits the backend with an unknown id (404).
//   2. adding a variant that is already in the cart merges server-side, so the
//      returned line can carry a different quantity than the requested one and
//      may collide with a line we already hold — the duplicate is dropped here.
function applyServerItem(
  items: CartItem[],
  serverItem: CartItem,
  optimisticId: string
): CartItem[] {
  let replaced = false
  const next: CartItem[] = []
  for (const item of items) {
    if (item.id === optimisticId || item.id === serverItem.id) {
      if (!replaced) {
        next.push(normalizeItem(serverItem))
        replaced = true
      }
      continue
    }
    next.push(item)
  }
  if (!replaced) next.push(normalizeItem(serverItem))
  return next
}

export const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart)
  const [isInitializing, setIsInitializing] = useState(true)
  const { isAuthenticated, isLoading: authLoading, role } = useAuth()

  // Only BUYER users (customer portal) have a backend cart.
  // Seller/Admin tokens are bound to a different portal and would get 403.
  const isCustomerPortal = role === "BUYER" || role === null

  // One-time cleanup: remove the legacy localStorage guest cart from before the
  // backend-sync migration and the variant-options cache that #188 made obsolete.
  // Harmless if the keys don't exist.
  useEffect(() => {
    try {
      localStorage.removeItem("guest_cart")
    } catch {
      // localStorage may be unavailable (private mode, SSR); safe to ignore.
    }
    clearLegacyVariantOptionsCache()
  }, [])

  // Sync cart with backend on auth state changes:
  //   - guest (unauthenticated) → backend resolves via cartSessionId cookie
  //   - authenticated customer → backend resolves via Authorization header
  //   - authenticated seller/admin → no cart (skip fetch)
  //
  // This is also the guest-cart-merge path. The merge runs inside the login
  // request (`CartMergeService`) and reports nothing back: the login response
  // carries no cart, no cart id, no item count, and silently dropped guest lines
  // produce no signal at all. `isAuthenticated` flipping is the only trigger the
  // client has, so the fresh GET below is mandatory to see the merged state.
  useEffect(() => {
    if (authLoading) return

    if (isAuthenticated && !isCustomerPortal) {
      // Seller/admin portals don't have a cart — reset local state on portal switch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // Snapshot previous state for rollback before any optimistic mutation
      const prevCart = cart

      // Optimistic update. The display fields come from the DTO purely to avoid a
      // flicker until the server answers — they are overwritten by the server line
      // below, which is the only source the rendered cart depends on.
      const optimisticId = `${dto.productId}-${dto.variantId ?? "default"}-${Date.now()}`
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
          id: optimisticId,
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

      // Sync with backend and adopt the persisted line (id, quantity, display data)
      try {
        const serverItem = await CartService.addItem(dto)
        setCart((prev) => ({
          ...prev,
          items: applyServerItem(prev.items, serverItem, optimisticId),
        }))
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

      // Sync with backend. `quantity <= 0` is rejected by PATCH and never deletes
      // (BE docs/api/cart.md) — the delete route is the only way to drop a line.
      try {
        if (dto.quantity <= 0) {
          await CartService.removeItem(itemId)
        } else {
          const serverItem = await CartService.updateItem(itemId, dto)
          setCart((prev) => ({
            ...prev,
            items: applyServerItem(prev.items, serverItem, itemId),
          }))
        }
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

  const { totalItems, totalPrice } = useMemo(() => {
    const items = cart.items ?? []
    return {
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: items.reduce(
        (sum, i) => sum + (i.unitPriceCents != null ? (i.unitPriceCents * i.quantity) / 100 : 0),
        0
      ),
    }
  }, [cart])

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading: isInitializing,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      refetch,
      totalItems,
      totalPrice,
    }),
    [
      cart,
      isInitializing,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      refetch,
      totalItems,
      totalPrice,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
