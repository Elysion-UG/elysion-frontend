import { describe, it, expect, beforeEach } from "vitest"
import {
  saveProductDisplay,
  getProductDisplay,
  getProductDisplayCache,
  clearLegacyVariantOptionsCache,
} from "./product-display-cache"

describe("product display cache", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.setItem("elysion_cookie_consent", "accepted")
  })

  it("returns null for unknown productId", () => {
    expect(getProductDisplay("unknown")).toBeNull()
  })

  it("returns null for empty productId", () => {
    expect(getProductDisplay("")).toBeNull()
  })

  it("saves and retrieves a product entry", () => {
    saveProductDisplay("p1", { name: "Eco Shirt", imageUrl: "/img.jpg", slug: "eco-shirt" })
    expect(getProductDisplay("p1")).toEqual({
      name: "Eco Shirt",
      imageUrl: "/img.jpg",
      slug: "eco-shirt",
    })
  })

  it("does not save entries without a name", () => {
    saveProductDisplay("p1", { name: "" })
    expect(getProductDisplay("p1")).toBeNull()
  })

  it("does not save entries without a productId", () => {
    saveProductDisplay("", { name: "Eco Shirt" })
    expect(getProductDisplay("")).toBeNull()
  })

  it("merges multiple entries without overwriting", () => {
    saveProductDisplay("p1", { name: "Shirt" })
    saveProductDisplay("p2", { name: "Pants" })
    expect(getProductDisplay("p1")?.name).toBe("Shirt")
    expect(getProductDisplay("p2")?.name).toBe("Pants")
  })

  it("overwrites an existing entry for the same productId", () => {
    saveProductDisplay("p1", { name: "Old Name" })
    saveProductDisplay("p1", { name: "New Name" })
    expect(getProductDisplay("p1")?.name).toBe("New Name")
  })

  it("getProductDisplayCache returns all stored entries", () => {
    saveProductDisplay("p1", { name: "Shirt" })
    saveProductDisplay("p2", { name: "Pants" })
    const cache = getProductDisplayCache()
    expect(Object.keys(cache)).toHaveLength(2)
    expect(cache["p1"].name).toBe("Shirt")
  })
})

describe("legacy variant options cache (#188)", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.setItem("elysion_cookie_consent", "accepted")
  })

  it("removes the obsolete variant_options_cache key", () => {
    localStorage.setItem(
      "variant_options_cache",
      JSON.stringify({ v1: [{ name: "N", value: "V" }] })
    )
    clearLegacyVariantOptionsCache()
    expect(localStorage.getItem("variant_options_cache")).toBeNull()
  })

  it("is a no-op when the key does not exist", () => {
    expect(() => clearLegacyVariantOptionsCache()).not.toThrow()
    expect(localStorage.getItem("variant_options_cache")).toBeNull()
  })

  describe("tampered localStorage narrowing (#70.5)", () => {
    it("drops display entries whose name is not a string", () => {
      localStorage.setItem(
        "product_display_cache",
        JSON.stringify({ p1: { name: null }, p2: { name: "Valid", imageUrl: "/i.jpg" } })
      )
      expect(getProductDisplay("p1")).toBeNull()
      expect(getProductDisplay("p2")).toEqual({ name: "Valid", imageUrl: "/i.jpg" })
    })

    it("drops display entries with a non-string imageUrl/slug", () => {
      localStorage.setItem(
        "product_display_cache",
        JSON.stringify({ p1: { name: "N", imageUrl: 42 }, p2: { name: "N", slug: {} } })
      )
      expect(getProductDisplayCache()).toEqual({})
    })
  })
})
