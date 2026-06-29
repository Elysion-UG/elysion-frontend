import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import { useAuth } from "@/src/context/AuthContext"
import { useRouter } from "next/navigation"

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock("@/src/context/AuthContext", () => ({
  useAuth: vi.fn(),
}))

const replace = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace })),
}))

import SellerGuard from "./SellerGuard"

const mockedUseAuth = vi.mocked(useAuth)

type AuthState = Partial<ReturnType<typeof useAuth>>

function setAuth(state: AuthState): void {
  mockedUseAuth.mockReturnValue(state as ReturnType<typeof useAuth>)
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("SellerGuard", () => {
  beforeEach(() => {
    replace.mockClear()
    vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>)
  })

  it("renders children for an authenticated SELLER", () => {
    setAuth({ isAuthenticated: true, isLoading: false, role: "SELLER" })

    render(
      <SellerGuard>
        <p>Seller content</p>
      </SellerGuard>
    )

    expect(screen.getByText("Seller content")).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it("redirects an unauthenticated user to the seller login", () => {
    setAuth({ isAuthenticated: false, isLoading: false, role: null })

    render(
      <SellerGuard>
        <p>Seller content</p>
      </SellerGuard>
    )

    expect(replace).toHaveBeenCalledWith("/login/seller")
    expect(screen.queryByText("Seller content")).not.toBeInTheDocument()
  })

  it("redirects a non-seller (BUYER) to the seller login", () => {
    setAuth({ isAuthenticated: true, isLoading: false, role: "BUYER" })

    render(
      <SellerGuard>
        <p>Seller content</p>
      </SellerGuard>
    )

    expect(replace).toHaveBeenCalledWith("/login/seller")
    expect(screen.queryByText("Seller content")).not.toBeInTheDocument()
  })

  it("redirects an ADMIN to the seller login", () => {
    setAuth({ isAuthenticated: true, isLoading: false, role: "ADMIN" })

    render(
      <SellerGuard>
        <p>Seller content</p>
      </SellerGuard>
    )

    expect(replace).toHaveBeenCalledWith("/login/seller")
  })

  it("shows a loading state and does not redirect while auth is loading", () => {
    setAuth({ isAuthenticated: false, isLoading: true, role: null })

    render(
      <SellerGuard>
        <p>Seller content</p>
      </SellerGuard>
    )

    expect(replace).not.toHaveBeenCalled()
    expect(screen.queryByText("Seller content")).not.toBeInTheDocument()
  })
})
