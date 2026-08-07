import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import FilterSidebar from "./FilterSidebar"
import type { Material, ProductFacetValue, SellerFacet } from "@/src/types"

const materials: Material[] = [
  { id: "m-1", slug: "leinen", name: "Leinen" },
  { id: "m-2", slug: "hanf", name: "Hanf" },
]

const colorFacets: ProductFacetValue[] = [
  { value: "blau", productCount: 2 },
  { value: "rot", productCount: 5 },
]

const sizeFacets: ProductFacetValue[] = [
  { value: "m", productCount: 3 },
  { value: "one size", productCount: 1 },
]

const sellerFacets: SellerFacet[] = [
  { id: "seller-a", companyName: "Alpha Manufaktur", productCount: 3 },
  { id: "seller-b", companyName: "Beta Weberei", productCount: 1 },
]

function renderSidebar(overrides: Partial<React.ComponentProps<typeof FilterSidebar>> = {}) {
  const props: React.ComponentProps<typeof FilterSidebar> = {
    isAuthenticated: false,
    hasValueProfile: false,
    sustainabilityImportance: {},
    onImportanceChange: vi.fn(),
    priceRange: { min: 0, max: 300 },
    onPriceRangeChange: vi.fn(),
    materials,
    selectedMaterials: [],
    onToggleMaterial: vi.fn(),
    colorFacets,
    selectedColors: [],
    onToggleColor: vi.fn(),
    sizeFacets,
    selectedSizes: [],
    onToggleSize: vi.fn(),
    sellerFacets,
    selectedSellerIds: [],
    onToggleSeller: vi.fn(),
    onPageReset: vi.fn(),
    ...overrides,
  }
  render(<FilterSidebar {...props} />)
  return props
}

describe("FilterSidebar – Material", () => {
  it("renders a checkbox per material", () => {
    renderSidebar()
    expect(screen.getByRole("checkbox", { name: "Leinen" })).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Hanf" })).toBeInTheDocument()
  })

  it("calls onToggleMaterial with the material slug when toggled", () => {
    const props = renderSidebar()
    fireEvent.click(screen.getByRole("checkbox", { name: "Leinen" }))
    expect(props.onToggleMaterial).toHaveBeenCalledWith("leinen")
  })

  it("reflects the selected materials as checked", () => {
    renderSidebar({ selectedMaterials: ["hanf"] })
    expect(screen.getByRole("checkbox", { name: "Hanf" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Leinen" })).not.toBeChecked()
  })

  it("does not render the material section when there are no materials", () => {
    renderSidebar({ materials: [] })
    expect(screen.queryByText("Material")).not.toBeInTheDocument()
  })
})

describe("FilterSidebar – Farbe (#49)", () => {
  it("renders a swatch checkbox per colour facet, capitalised for display", () => {
    renderSidebar()
    expect(screen.getByRole("checkbox", { name: "Blau, 2 Produkte" })).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Rot, 5 Produkte" })).toBeInTheDocument()
  })

  it("passes the original lower-case facet value back on toggle", () => {
    const props = renderSidebar()
    fireEvent.click(screen.getByRole("checkbox", { name: "Rot, 5 Produkte" }))
    expect(props.onToggleColor).toHaveBeenCalledWith("rot")
  })

  it("reflects the selected colours as checked", () => {
    renderSidebar({ selectedColors: ["blau"] })
    expect(screen.getByRole("checkbox", { name: "Blau, 2 Produkte" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Rot, 5 Produkte" })).not.toBeChecked()
  })

  it("is operable by keyboard", async () => {
    const user = userEvent.setup()
    const props = renderSidebar()
    const checkbox = screen.getByRole("checkbox", { name: "Blau, 2 Produkte" })
    checkbox.focus()
    expect(checkbox).toHaveFocus()
    await user.keyboard(" ")
    expect(props.onToggleColor).toHaveBeenCalledWith("blau")
  })

  it("does not render the colour section without facet values", () => {
    renderSidebar({ colorFacets: [] })
    expect(screen.queryByRole("button", { name: /Farbe/ })).not.toBeInTheDocument()
  })

  it("states that the counts are global, not narrowed by the other filters", () => {
    renderSidebar({ sizeFacets: [], sellerFacets: [] })
    expect(screen.getByText(/unabhängig von den übrigen Filtern/)).toBeInTheDocument()
  })

  it("collapses and expands the section", () => {
    renderSidebar()
    const header = screen.getByRole("button", { name: /Farbe/ })
    expect(header).toHaveAttribute("aria-expanded", "true")
    fireEvent.click(header)
    expect(header).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("checkbox", { name: "Rot, 5 Produkte" })).not.toBeInTheDocument()
  })

  it("shows the number of selected colours in the section header", () => {
    renderSidebar({ selectedColors: ["rot", "blau"] })
    expect(screen.getByRole("button", { name: /Farbe\s*2/ })).toBeInTheDocument()
  })
})

describe("FilterSidebar – Größe (#49)", () => {
  it("renders a chip per size facet, letter sizes upper-cased", () => {
    renderSidebar()
    expect(screen.getByRole("checkbox", { name: "M, 3 Produkte" })).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "One size, 1 Produkte" })).toBeInTheDocument()
  })

  it("passes the original facet value back on toggle", () => {
    const props = renderSidebar()
    fireEvent.click(screen.getByRole("checkbox", { name: "M, 3 Produkte" }))
    expect(props.onToggleSize).toHaveBeenCalledWith("m")
  })

  it("reflects the selected sizes as checked", () => {
    renderSidebar({ selectedSizes: ["one size"] })
    expect(screen.getByRole("checkbox", { name: "One size, 1 Produkte" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "M, 3 Produkte" })).not.toBeChecked()
  })

  it("does not render the size section without facet values", () => {
    renderSidebar({ sizeFacets: [] })
    expect(screen.queryByRole("button", { name: /Größe/ })).not.toBeInTheDocument()
  })
})

describe("FilterSidebar – Hersteller (#50)", () => {
  it("renders a checkbox per manufacturer with its product count", () => {
    renderSidebar()
    expect(
      screen.getByRole("checkbox", { name: "Alpha Manufaktur, 3 Produkte" })
    ).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Beta Weberei, 1 Produkte" })).toBeInTheDocument()
  })

  it("passes the seller id — not the company name — back on toggle", () => {
    const props = renderSidebar()
    fireEvent.click(screen.getByRole("checkbox", { name: "Alpha Manufaktur, 3 Produkte" }))
    expect(props.onToggleSeller).toHaveBeenCalledWith("seller-a")
  })

  it("supports multi-select and reflects it as checked", () => {
    renderSidebar({ selectedSellerIds: ["seller-a", "seller-b"] })
    expect(screen.getByRole("checkbox", { name: "Alpha Manufaktur, 3 Produkte" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Beta Weberei, 1 Produkte" })).toBeChecked()
  })

  it("does not render the manufacturer section without facet values", () => {
    renderSidebar({ sellerFacets: [] })
    expect(screen.queryByRole("button", { name: /Hersteller/ })).not.toBeInTheDocument()
  })
})
