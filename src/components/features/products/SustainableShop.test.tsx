import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import React from "react"

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUseAuth = vi.fn()
const mockUseBuyerValueProfile = vi.fn()
const mockUseProducts = vi.fn()

vi.mock("@/src/context/AuthContext", () => ({ useAuth: () => mockUseAuth() }))
vi.mock("@/src/hooks/useBuyerValueProfile", () => ({
  useBuyerValueProfile: (_enabled?: boolean) => mockUseBuyerValueProfile(),
}))
vi.mock("@/src/hooks/useProducts", () => ({
  useProducts: () => mockUseProducts(),
  PRODUCTS_PAGE_SIZE: 12,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/src/lib/currency", () => ({
  formatEuro: (v: number) => `${v} €`,
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

function defaultProductsState() {
  mockUseProducts.mockReturnValue({
    data: null,
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────────

import SustainableShop from "./SustainableShop"

describe("SustainableShop — sustainability sliders", () => {
  beforeEach(() => {
    defaultProductsState()
  })

  it("shows sliders at middle value (2) when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    mockUseBuyerValueProfile.mockReturnValue({ data: undefined })

    const { container } = render(<SustainableShop />)

    // Sustainability sliders are range inputs with max="4" (price slider has max="300")
    const sliders = container.querySelectorAll<HTMLInputElement>('input[type="range"][max="4"]')
    expect(sliders.length).toBeGreaterThan(0)
    sliders.forEach((slider) => {
      expect(slider.value).toBe("2")
    })
  })

  it("shows sliders at middle value (2) when authenticated but no profile saved", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUseBuyerValueProfile.mockReturnValue({ data: null })

    const { container } = render(<SustainableShop />)

    const sliders = container.querySelectorAll<HTMLInputElement>('input[type="range"][max="4"]')
    expect(sliders.length).toBeGreaterThan(0)
    sliders.forEach((slider) => {
      expect(slider.value).toBe("2")
    })
  })

  it("maps profile weights (0–100) to slider values (1–4) when profile is loaded", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUseBuyerValueProfile.mockReturnValue({
      data: {
        simpleProfile: {
          // 0 → 1, 33 → 2, 67 → 3, 100 → 4
          produktqualitaet: 100, // → "4"
          oekologisch: 67, // → "3"
          oekonomisch: 33, // → "2"
          sozial: 0, // → "1"
          kulturell: 50,
          politisch: 50,
          technologisch: 50,
          institutionell: 50,
        },
      },
    })

    const { container } = render(<SustainableShop />)

    // Sliders are rendered in sustainabilityFilters key order:
    // produktqualitaet, oekologisch, oekonomisch, sozial, …
    const sliders = container.querySelectorAll<HTMLInputElement>('input[type="range"][max="4"]')
    expect(sliders[0].value).toBe("4") // produktqualitaet: 100
    expect(sliders[1].value).toBe("3") // oekologisch: 67
    expect(sliders[2].value).toBe("2") // oekonomisch: 33
    expect(sliders[3].value).toBe("1") // sozial: 0
  })

  it("shows 'Aus deinem Werteprofil' badge when profile is loaded", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUseBuyerValueProfile.mockReturnValue({
      data: {
        simpleProfile: { produktqualitaet: 75 },
      },
    })

    render(<SustainableShop />)

    expect(screen.getByText("Aus deinem Werteprofil")).toBeInTheDocument()
  })

  it("shows hint text instead of badge when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    mockUseBuyerValueProfile.mockReturnValue({ data: undefined })

    render(<SustainableShop />)

    expect(screen.queryByText("Aus deinem Werteprofil")).not.toBeInTheDocument()
    expect(screen.getByText("Wie wichtig ist dir jeder Nachhaltigkeitsaspekt?")).toBeInTheDocument()
  })

  it("expands the sustainability section by default", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    mockUseBuyerValueProfile.mockReturnValue({ data: undefined })

    const { container } = render(<SustainableShop />)

    // Sliders are only rendered when the section is expanded
    const sliders = container.querySelectorAll('input[type="range"][max="4"]')
    expect(sliders.length).toBeGreaterThan(0)
  })
})

describe("profileWeightToSlider mapping", () => {
  // Test the mapping function indirectly via the slider values
  it("maps boundary values correctly (0→1, 100→4)", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUseBuyerValueProfile.mockReturnValue({
      data: {
        simpleProfile: {
          produktqualitaet: 0,
          oekologisch: 100,
        },
      },
    })
    defaultProductsState()

    const { container } = render(<SustainableShop />)

    const sliders = container.querySelectorAll<HTMLInputElement>('input[type="range"][max="4"]')
    expect(sliders[0].value).toBe("1") // 0 → 1
    expect(sliders[1].value).toBe("4") // 100 → 4
  })
})
