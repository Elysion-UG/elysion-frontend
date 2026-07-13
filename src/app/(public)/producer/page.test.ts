import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }))

vi.mock("@/src/services/product.service", () => ({
  ProductService: { list: mockList },
}))
vi.mock("@/src/components/features/products/ProducerPage", () => ({ default: () => null }))

import { generateMetadata } from "./page"

describe("producer page — generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("derives the company name from the seller's products", async () => {
    mockList.mockResolvedValueOnce({
      items: [{ seller: { companyName: "GreenThread" } }],
      page: 0,
      totalPages: 1,
    })

    const meta = await generateMetadata({ searchParams: Promise.resolve({ id: "s1" }) })

    expect(meta.title).toBe("GreenThread")
    expect(meta.description).toContain("GreenThread")
    expect(mockList).toHaveBeenCalledWith({ sellerId: "s1", size: 10 })
  })

  it("returns a generic title when no id is present", async () => {
    const meta = await generateMetadata({ searchParams: Promise.resolve({}) })
    expect(meta.title).toBe("Produzent")
    expect(mockList).not.toHaveBeenCalled()
  })

  it("returns a generic title when no company name can be resolved", async () => {
    mockList.mockResolvedValueOnce({ items: [{ seller: null }], page: 0, totalPages: 1 })
    const meta = await generateMetadata({ searchParams: Promise.resolve({ id: "s1" }) })
    expect(meta.title).toBe("Produzent")
  })

  it("falls back to a generic title when the fetch fails", async () => {
    mockList.mockRejectedValueOnce(new Error("boom"))
    const meta = await generateMetadata({ searchParams: Promise.resolve({ id: "s1" }) })
    expect(meta.title).toBe("Produzent")
  })
})
