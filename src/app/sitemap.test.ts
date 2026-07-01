import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }))
vi.mock("@/src/services/product.service", () => ({
  ProductService: { list: mockList },
}))

import sitemap from "./sitemap"

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("includes the static public pages and paginates through all product pages", async () => {
    mockList
      .mockResolvedValueOnce({
        items: [{ slug: "shirt-a" }, { slug: "shirt-b" }],
        page: 0,
        totalPages: 2,
      })
      .mockResolvedValueOnce({ items: [{ slug: "shirt-c" }], page: 1, totalPages: 2 })

    const urls = (await sitemap()).map((e) => e.url)

    expect(urls).toEqual(expect.arrayContaining(["/", "/about", "/impressum", "/agb"]))
    expect(urls.some((u) => u.includes("/product?slug=shirt-a"))).toBe(true)
    expect(urls.some((u) => u.includes("/product?slug=shirt-c"))).toBe(true)
    expect(mockList).toHaveBeenCalledTimes(2)
  })

  it("degrades to a static-only sitemap when the product fetch fails", async () => {
    mockList.mockRejectedValueOnce(new Error("backend down"))

    const urls = (await sitemap()).map((e) => e.url)

    expect(urls).toEqual(expect.arrayContaining(["/"]))
    expect(urls.some((u) => u.includes("/product?slug="))).toBe(false)
  })

  it("stops paging at the safety cap even if totalPages is huge", async () => {
    mockList.mockResolvedValue({ items: [{ slug: "x" }], page: 0, totalPages: 9999 })

    await sitemap()

    // MAX_SITEMAP_PAGES = 50
    expect(mockList).toHaveBeenCalledTimes(50)
  })
})
