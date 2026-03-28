"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { Cart, CartItem, AddToCartDTO } from "@/src/types"
import { CartService } from "@/src/services/cart.service"

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

export const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Silently sync cart from backend on mount; 401 = not logged in → keep empty cart
    CartService.get()
      .then((data) => {
        if (data?.items) setCart(data)
      })
      .catch(() => {})
  }, [])

  const addItem = useCallback(async (dto: AddToCartDTO) => {
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
        variantOptions: [],
      }
      return { ...prev, items: [...prev.items, newItem] }
    })
    // Sync with backend — replace optimistic state with server response if valid
    try {
      const updated = await CartService.addItem(dto)
      if (updated?.items) setCart(updated)
    } catch {
      // keep optimistic state on failure
    }
  }, [])

  const updateItem = useCallback(async (itemId: string, dto: { quantity: number }) => {
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
      const updated = await CartService.updateItem(itemId, dto)
      if (updated?.items) setCart(updated)
    } catch {
      // keep optimistic state on failure
    }
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    // Optimistic update
    setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }))
    // Sync with backend
    try {
      await CartService.removeItem(itemId)
    } catch {
      // keep optimistic state on failure
    }
  }, [])

  const clearCart = useCallback(() => {
    setCart(emptyCart)
  }, [])

  const refetch = useCallback(async () => {
    try {
      const updated = await CartService.get()
      if (updated?.items) setCart(updated)
    } catch {
      // ignore errors
    }
  }, [])

  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = cart.items.reduce(
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
