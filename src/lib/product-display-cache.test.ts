import { describe, it, expect, beforeEach } from "vitest"
import {
  saveProductDisplay,
  getProductDisplay,
  getProductDisplayCache,
  saveVariantOptions,
  getVariantOptions,
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

describe("variant options cache", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.setItem("elysion_cookie_consent", "accepted")
  })

  it("returns null for unknown variantId", () => {
    expect(getVariantOptions("unknown")).toBeNull()
  })

  it("returns null for empty variantId", () => {
    expect(getVariantOptions("")).toBeNull()
  })

  it("saves and retrieves variant options", () => {
    saveVariantOptions("v1", [{ name: "Größe", value: "XL" }])
    expect(getVariantOptions("v1")).toEqual([{ name: "Größe", value: "XL" }])
  })

  it("does not save empty options array", () => {
    saveVariantOptions("v1", [])
    expect(getVariantOptions("v1")).toBeNull()
  })

  it("does not save without a variantId", () => {
    saveVariantOptions("", [{ name: "Größe", value: "XL" }])
    expect(getVariantOptions("")).toBeNull()
  })

  it("merges multiple variant entries", () => {
    saveVariantOptions("v1", [{ name: "Größe", value: "S" }])
    saveVariantOptions("v2", [{ name: "Farbe", value: "Blau" }])
    expect(getVariantOptions("v1")?.[0].value).toBe("S")
    expect(getVariantOptions("v2")?.[0].value).toBe("Blau")
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

    it("drops variant options that are not { name, value } string pairs", () => {
      localStorage.setItem(
        "variant_options_cache",
        JSON.stringify({ v1: [{ name: "Größe", value: 1 }], v2: [{ name: "Farbe", value: "Rot" }] })
      )
      expect(getVariantOptions("v1")).toBeNull()
      expect(getVariantOptions("v2")?.[0].value).toBe("Rot")
    })
  })
})
