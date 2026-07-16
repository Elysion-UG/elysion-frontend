import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
vi.mock("@/src/hooks/useMaterials", () => ({
  useMaterials: () => ({ data: [] }),
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

    // Sustainability sliders are range inputs with max="5" (price slider has max="300")
    const sliders = container.querySelectorAll<HTMLInputElement>('input[type="range"][max="5"]')
    expect(sliders.length).toBeGreaterThan(0)
    sliders.forEach((slider) => {
      expect(slider.value).toBe("3")
    })
  })

  it("shows sliders at middle value (2) when authenticated but no profile saved", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUseBuyerValueProfile.mockReturnValue({ data: null })

    const { container } = render(<SustainableShop />)

    const sliders = container.querySelectorAll<HTMLInputElement>('input[type="range"][max="5"]')
    expect(sliders.length).toBeGreaterThan(0)
    sliders.forEach((slider) => {
      expect(slider.value).toBe("3")
    })
  })

  it("maps profile weights (0–100) to slider values (1–4) when profile is loaded", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUseBuyerValueProfile.mockReturnValue({
      data: {
        simpleProfile: {
          // 0 → 1, 25 → 2, 50 → 3, 75 → 4, 100 → 5
          produktqualitaet: 100, // → "5"
          oekologisch: 75, // → "4"
          oekonomisch: 25, // → "2"
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
    const sliders = container.querySelectorAll<HTMLInputElement>('input[type="range"][max="5"]')
    expect(sliders[0].value).toBe("5") // produktqualitaet: 100
    expect(sliders[1].value).toBe("4") // oekologisch: 75
    expect(sliders[2].value).toBe("2") // oekonomisch: 25
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
    const sliders = container.querySelectorAll('input[type="range"][max="5"]')
    expect(sliders.length).toBeGreaterThan(0)
  })
})

describe("SustainableShop — mobile filter Sheet (#78)", () => {
  beforeEach(() => {
    defaultProductsState()
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    mockUseBuyerValueProfile.mockReturnValue({ data: undefined })
  })

  it("renders a mobile 'Filter' trigger and keeps the Sheet closed initially", () => {
    render(<SustainableShop />)
    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument()
    // The Sheet's own title is not mounted while the Sheet is closed.
    expect(screen.queryByText("Produkte filtern")).not.toBeInTheDocument()
  })

  it("opens the Sheet with the filter controls when the trigger is clicked", async () => {
    const user = userEvent.setup()
    render(<SustainableShop />)

    await user.click(screen.getByRole("button", { name: "Filter" }))

    expect(await screen.findByText("Produkte filtern")).toBeInTheDocument()
    // Filter controls (the sustainability section) are now reachable inside the Sheet.
    expect(screen.getAllByText("Nachhaltigkeitspräferenzen").length).toBeGreaterThan(0)
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

    const sliders = container.querySelectorAll<HTMLInputElement>('input[type="range"][max="5"]')
    expect(sliders[0].value).toBe("1") // 0 → 1
    expect(sliders[1].value).toBe("5") // 100 → 5
  })
})
