"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import type { Cart, CartItem, AddToCartDTO } from "@/src/types"

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
  const [isLoading] = useState(false)

  const addItem = useCallback(async (dto: AddToCartDTO) => {
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
  }, [])

  const updateItem = useCallback(async (itemId: string, dto: { quantity: number }) => {
    if (dto.quantity <= 0) {
      setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }))
    } else {
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? { ...i, quantity: dto.quantity } : i)),
      }))
    }
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }))
  }, [])

  const clearCart = useCallback(() => {
    setCart(emptyCart)
  }, [])

  const refetch = useCallback(async () => {
    // No-op for local cart — will call CartService.getCart() once backend is ready
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
