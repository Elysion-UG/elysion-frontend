import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUseAuth = vi.fn()
const mockUseBuyerValueProfile = vi.fn()
const mockUseProducts = vi.fn()
const mockUseProductFacets = vi.fn()
const mockUseSellerFacets = vi.fn()
const mockRefetchProductFacets = vi.fn()
const mockRefetchSellerFacets = vi.fn()

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
vi.mock("@/src/hooks/useProductFacets", () => ({
  useProductFacets: () => mockUseProductFacets(),
}))
vi.mock("@/src/hooks/useSellerFacets", () => ({
  useSellerFacets: () => mockUseSellerFacets(),
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

/** Both facet queries succeed — the state every test starts from. */
beforeEach(() => {
  mockUseProductFacets.mockReturnValue({
    data: { colors: [], sizes: [] },
    isError: false,
    refetch: mockRefetchProductFacets,
  })
  mockUseSellerFacets.mockReturnValue({
    data: [],
    isError: false,
    refetch: mockRefetchSellerFacets,
  })
  mockRefetchProductFacets.mockClear()
  mockRefetchSellerFacets.mockClear()
})

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

describe("SustainableShop — Filter zurücksetzen", () => {
  /**
   * The failure this guards against: a logged-in buyer gets the sliders seeded
   * from the value profile, so they are off the neutral middle and counted by
   * countActiveFilters. Before the fix, resetFilters left them untouched — the
   * badge kept its number and the sliders kept their position after a reset.
   */
  function renderWithSeededSliders() {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockUseBuyerValueProfile.mockReturnValue({
      data: {
        simpleProfile: {
          // The remaining seven axes fall back to "2" — also off the middle.
          produktqualitaet: 100,
        },
      },
    })
    defaultProductsState()
    return render(<SustainableShop />)
  }

  function sliderValues(container: HTMLElement) {
    return Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="range"][max="5"]')
    ).map((slider) => slider.value)
  }

  it("counts the seeded sliders in the mobile filter badge", () => {
    const { container } = renderWithSeededSliders()

    expect(sliderValues(container)).toEqual(["5", "2", "2", "2", "2", "2", "2", "2"])
    expect(screen.getByRole("button", { name: /Filter\s*8/ })).toBeInTheDocument()
  })

  it("resets the sustainability sliders together with the other axes", async () => {
    const user = userEvent.setup()
    const { container } = renderWithSeededSliders()

    await user.click(screen.getByRole("button", { name: "Filter zurücksetzen" }))

    expect(sliderValues(container)).toEqual(["3", "3", "3", "3", "3", "3", "3", "3"])
  })

  it("clears the badge and the reset offer once nothing is active any more", async () => {
    const user = userEvent.setup()
    renderWithSeededSliders()

    await user.click(screen.getByRole("button", { name: "Filter zurücksetzen" }))

    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Filter\s*\d/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Filter zurücksetzen" })).not.toBeInTheDocument()
    expect(screen.getByText("Aktuell sind keine Produkte verfügbar")).toBeInTheDocument()
  })

  it("keeps the chosen sort order — it is not a filter and is not counted", async () => {
    const user = userEvent.setup()
    renderWithSeededSliders()

    await user.click(screen.getByRole("button", { name: "Neueste" }))
    await user.click(screen.getByRole("button", { name: "Preis: Niedrig → Hoch" }))
    await user.click(screen.getByRole("button", { name: "Filter zurücksetzen" }))

    expect(screen.getByRole("button", { name: "Preis: Niedrig → Hoch" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Neueste" })).not.toBeInTheDocument()
  })
})

describe("SustainableShop — Facetten-Ausfall", () => {
  beforeEach(() => {
    defaultProductsState()
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    mockUseBuyerValueProfile.mockReturnValue({ data: undefined })
  })

  it("stays silent while both facet queries are fine", () => {
    render(<SustainableShop />)
    expect(screen.queryByText(/konnten nicht geladen werden/)).not.toBeInTheDocument()
  })

  it("names colour and size when the product facet endpoint fails", () => {
    mockUseProductFacets.mockReturnValue({
      data: undefined,
      isError: true,
      refetch: mockRefetchProductFacets,
    })

    render(<SustainableShop />)

    expect(
      screen.getByText("Filter für Farbe und Größe konnten nicht geladen werden.")
    ).toBeInTheDocument()
  })

  it("names the manufacturer axis when the seller facet endpoint fails", () => {
    mockUseSellerFacets.mockReturnValue({
      data: undefined,
      isError: true,
      refetch: mockRefetchSellerFacets,
    })

    render(<SustainableShop />)

    expect(
      screen.getByText("Filter für Hersteller konnten nicht geladen werden.")
    ).toBeInTheDocument()
  })

  it("lists all three axes when both endpoints fail", () => {
    mockUseProductFacets.mockReturnValue({
      data: undefined,
      isError: true,
      refetch: mockRefetchProductFacets,
    })
    mockUseSellerFacets.mockReturnValue({
      data: undefined,
      isError: true,
      refetch: mockRefetchSellerFacets,
    })

    render(<SustainableShop />)

    expect(
      screen.getByText("Filter für Farbe, Größe und Hersteller konnten nicht geladen werden.")
    ).toBeInTheDocument()
  })

  it("refetches only the failed facet query on retry", async () => {
    const user = userEvent.setup()
    mockUseSellerFacets.mockReturnValue({
      data: undefined,
      isError: true,
      refetch: mockRefetchSellerFacets,
    })

    render(<SustainableShop />)
    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }))

    expect(mockRefetchSellerFacets).toHaveBeenCalledTimes(1)
    expect(mockRefetchProductFacets).not.toHaveBeenCalled()
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
