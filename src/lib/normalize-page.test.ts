import { describe, it, expect } from "vitest"
import { normalizePage } from "./normalize-page"

describe("normalizePage", () => {
  it("passes through a backend envelope ({ items, page, size, totalItems, totalPages })", () => {
    const page = normalizePage({
      items: ["a", "b"],
      page: 2,
      size: 10,
      totalItems: 42,
      totalPages: 5,
    })
    expect(page).toEqual({ items: ["a", "b"], page: 2, size: 10, totalItems: 42, totalPages: 5 })
  })

  it("maps a Spring-shaped response ({ content, number, totalElements }) to the canonical shape", () => {
    const page = normalizePage({
      content: ["a"],
      number: 1,
      size: 20,
      totalElements: 21,
      totalPages: 2,
    })
    expect(page).toEqual({ items: ["a"], page: 1, size: 20, totalItems: 21, totalPages: 2 })
  })

  it("wraps a bare array as a single full page", () => {
    expect(normalizePage(["a", "b", "c"])).toEqual({
      items: ["a", "b", "c"],
      page: 0,
      size: 3,
      totalItems: 3,
      totalPages: 1,
    })
  })

  it("applies the item mapper", () => {
    const page = normalizePage(
      { items: [1, 2, 3], page: 0, size: 3, totalItems: 3, totalPages: 1 },
      (n) => n * 2
    )
    expect(page.items).toEqual([2, 4, 6])
  })

  it("returns an empty page for null/undefined input", () => {
    expect(normalizePage(null)).toEqual({
      items: [],
      page: 0,
      size: 0,
      totalItems: 0,
      totalPages: 1,
    })
    expect(normalizePage(undefined)).toEqual({
      items: [],
      page: 0,
      size: 0,
      totalItems: 0,
      totalPages: 1,
    })
  })

  it("derives totalPages from totalItems/size when absent", () => {
    const page = normalizePage({ items: ["a", "b"], page: 0, size: 10, totalItems: 25 })
    expect(page.totalPages).toBe(3)
  })
})
