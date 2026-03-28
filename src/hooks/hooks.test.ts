import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import React from "react"
import { AuthProvider } from "@/src/context/AuthContext"
import { CartProvider } from "@/src/context/CartContext"
import { useAuth } from "./useAuth"
import { useCart } from "./useCart"

vi.mock("@/src/services/auth.service", () => ({
  AuthService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}))

describe("useAuth hook", () => {
  it("returns auth context when used inside AuthProvider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthProvider, null, children)
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current).toBeDefined()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it("throws when used outside AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within"
    )
  })
})

describe("useCart hook", () => {
  it("returns cart context when used inside CartProvider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(CartProvider, null, children)
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current).toBeDefined()
    expect(result.current.cart).toBeDefined()
    expect(result.current.cart.items).toEqual([])
  })

  it("throws when used outside CartProvider", () => {
    expect(() => renderHook(() => useCart())).toThrow(
      "useCart must be used within"
    )
  })
})
