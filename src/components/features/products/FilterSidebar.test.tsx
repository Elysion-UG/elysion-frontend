import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import FilterSidebar from "./FilterSidebar"
import type { Material } from "@/src/types"

const materials: Material[] = [
  { id: "m-1", slug: "leinen", name: "Leinen" },
  { id: "m-2", slug: "hanf", name: "Hanf" },
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
