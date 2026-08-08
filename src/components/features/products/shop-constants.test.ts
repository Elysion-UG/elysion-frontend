import { describe, it, expect } from "vitest"

import {
  countActiveFilters,
  MIDDLE_IMPORTANCE,
  DEFAULT_PRICE_RANGE,
  colorSwatch,
  facetLabel,
  sizeLabel,
  FALLBACK_SWATCH,
} from "./shop-constants"

/** Feeds the mobile "Filter (N)" badge (#78). */
describe("countActiveFilters (#78)", () => {
  const base = {
    selectedMaterials: [] as string[],
    selectedColors: [] as string[],
    selectedSizes: [] as string[],
    selectedSellerIds: [] as string[],
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

  it("counts each selected colour (#49)", () => {
    expect(countActiveFilters({ ...base, selectedColors: ["rot", "blau"] })).toBe(2)
  })

  it("counts each selected size (#49)", () => {
    expect(countActiveFilters({ ...base, selectedSizes: ["m"] })).toBe(1)
  })

  it("counts each selected manufacturer (#50)", () => {
    expect(countActiveFilters({ ...base, selectedSellerIds: ["s-1", "s-2", "s-3"] })).toBe(3)
  })

  it("sums all active filter kinds together", () => {
    const keys = Object.keys(MIDDLE_IMPORTANCE)
    expect(
      countActiveFilters({
        selectedMaterials: ["wolle"],
        selectedColors: ["rot"],
        selectedSizes: ["m", "l"],
        selectedSellerIds: ["s-1"],
        priceRange: { min: 10, max: 90 },
        sustainabilityImportance: { ...MIDDLE_IMPORTANCE, [keys[0]]: "4" },
      })
    ).toBe(7)
  })
})

describe("facet display helpers (#49)", () => {
  it("maps known colour names to a swatch colour", () => {
    expect(colorSwatch("rot")).toBe("#dc2626")
    expect(colorSwatch("blau")).toBe("#2563eb")
  })

  it("tolerates untrimmed / mixed-case values", () => {
    expect(colorSwatch(" Rot ")).toBe("#dc2626")
  })

  it("falls back to a neutral swatch for unknown colours", () => {
    expect(colorSwatch("aubergine")).toBe(FALLBACK_SWATCH)
  })

  it("capitalises colour labels without touching the filter value", () => {
    expect(facetLabel("rot")).toBe("Rot")
    expect(facetLabel("dunkelgrün")).toBe("Dunkelgrün")
    expect(facetLabel("")).toBe("")
  })

  it("upper-cases letter sizes and capitalises the rest", () => {
    expect(sizeLabel("m")).toBe("M")
    expect(sizeLabel("xxl")).toBe("XXL")
    expect(sizeLabel("38")).toBe("38")
    expect(sizeLabel("one size")).toBe("One size")
  })
})
