"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { Cart, AddToCartDTO, UpdateCartItemDTO } from "@/src/types"
import { CartService } from "@/src/services/cart.service"
import { useAuth } from "@/src/context/AuthContext"
import { ApiError } from "@/src/lib/api-client"

interface CartContextValue {
  cart: Cart | null
  itemCount: number
  isLoading: boolean
  addItem: (dto: AddToCartDTO) => Promise<void>
  updateItem: (itemId: string, dto: UpdateCartItemDTO) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  refetch: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await CartService.get()
      setCart(data)
    } catch (e) {
      // 404 = no cart yet — treat as empty
      if (e instanceof ApiError && e.status === 404) {
        setCart(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch cart once auth is resolved
  useEffect(() => {
    if (!authLoading) {
      fetchCart()
    }
  }, [authLoading, fetchCart])

  const addItem = useCallback(async (dto: AddToCartDTO) => {
    const updated = await CartService.addItem(dto)
    setCart(updated)
  }, [])

  const updateItem = useCallback(async (itemId: string, dto: UpdateCartItemDTO) => {
    const updated = await CartService.updateItem(itemId, dto)
    setCart(updated)
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    await CartService.removeItem(itemId)
    await fetchCart()
  }, [fetchCart])

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <CartContext.Provider value={{ cart, itemCount, isLoading, addItem, updateItem, removeItem, refetch: fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
