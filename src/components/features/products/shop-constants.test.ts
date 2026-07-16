import { describe, it, expect } from "vitest"

import { countActiveFilters, MIDDLE_IMPORTANCE, DEFAULT_PRICE_RANGE } from "./shop-constants"

/** Feeds the mobile "Filter (N)" badge (#78). */
describe("countActiveFilters (#78)", () => {
  const base = {
    selectedMaterials: [] as string[],
    priceRange: { ...DEFAULT_PRICE_RANGE },
    sustainabilityImportance: { ...MIDDLE_IMPORTANCE },
  }

  it("is 0 when nothing is filtered", () => {
    expect(countActiveFilters(base)).toBe(0)
  })

  it("counts each selected material", () => {
    expect(countActiveFilters({ ...base, selectedMaterials: ["leinen", "hanf"] })).toBe(2)
  })

  it("counts a narrowed price range once (min or max)", () => {
    expect(countActiveFilters({ ...base, priceRange: { min: 20, max: 300 } })).toBe(1)
    expect(countActiveFilters({ ...base, priceRange: { min: 0, max: 150 } })).toBe(1)
    expect(countActiveFilters({ ...base, priceRange: { min: 20, max: 150 } })).toBe(1)
  })

  it("counts sustainability sliders moved off the neutral middle", () => {
    const keys = Object.keys(MIDDLE_IMPORTANCE)
    const moved = { ...MIDDLE_IMPORTANCE, [keys[0]]: "5", [keys[1]]: "1" }
    expect(countActiveFilters({ ...base, sustainabilityImportance: moved })).toBe(2)
  })

  it("sums all active filter kinds together", () => {
    const keys = Object.keys(MIDDLE_IMPORTANCE)
    expect(
      countActiveFilters({
        selectedMaterials: ["wolle"],
        priceRange: { min: 10, max: 90 },
        sustainabilityImportance: { ...MIDDLE_IMPORTANCE, [keys[0]]: "4" },
      })
    ).toBe(3)
  })
})
