import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockGetBySlug } = vi.hoisted(() => ({ mockGetBySlug: vi.fn() }))

vi.mock("@/src/services/product.service", () => ({
  ProductService: { getBySlug: mockGetBySlug },
}))
vi.mock("@/src/components/features/products/ProductDetail", () => ({ default: () => null }))

import { generateMetadata } from "./page"

describe("product page — generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("builds title, description and OG image from the product", async () => {
    mockGetBySlug.mockResolvedValueOnce({
      name: "Bio T-Shirt",
      shortDesc: "Weiche Bio-Baumwolle aus fairem Anbau.",
      images: [{ url: "https://cdn.example/x.jpg" }],
    })

    const meta = await generateMetadata({
      searchParams: Promise.resolve({ slug: "bio-t-shirt" }),
    })

    expect(meta.title).toBe("Bio T-Shirt")
    expect(meta.description).toContain("Weiche Bio-Baumwolle")
    expect(mockGetBySlug).toHaveBeenCalledWith("bio-t-shirt")
    const images = (meta.openGraph as { images?: Array<{ url: string }> }).images
    expect(images?.[0]?.url).toBe("https://cdn.example/x.jpg")
  })

  it("returns a generic title when no slug is present", async () => {
    const meta = await generateMetadata({ searchParams: Promise.resolve({}) })
    expect(meta.title).toBe("Produkt")
    expect(mockGetBySlug).not.toHaveBeenCalled()
  })

  it("falls back to a generic title when the fetch fails", async () => {
    mockGetBySlug.mockRejectedValueOnce(new Error("404"))
    const meta = await generateMetadata({ searchParams: Promise.resolve({ slug: "missing" }) })
    expect(meta.title).toBe("Produkt")
  })
})
