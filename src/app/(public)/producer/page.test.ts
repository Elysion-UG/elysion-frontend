import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockList, mockGetPublicProfile } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockGetPublicProfile: vi.fn(),
}))

vi.mock("@/src/services/product.service", () => ({
  ProductService: { list: mockList },
}))
vi.mock("@/src/services/seller.service", () => ({
  SellerService: { getPublicProfile: mockGetPublicProfile },
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

  // ── ?slug= — the common case since producerHref() emits it for every
  // APPROVED seller (Elysion-UG/elysion-marketplace-backend#104) ─────────

  describe("?slug= path", () => {
    it("resolves the company name from the public seller profile", async () => {
      mockGetPublicProfile.mockResolvedValueOnce({
        id: "s1",
        slug: "alpha-manufaktur",
        companyName: "Alpha Manufaktur",
        certifications: [],
      })

      const meta = await generateMetadata({
        searchParams: Promise.resolve({ slug: "alpha-manufaktur" }),
      })

      expect(meta.title).toBe("Alpha Manufaktur")
      expect(meta.description).toContain("Alpha Manufaktur")
      expect(mockGetPublicProfile).toHaveBeenCalledWith("alpha-manufaktur")
      // The id-based derivation must not run for a slug link.
      expect(mockList).not.toHaveBeenCalled()
    })

    it("prefers the seller's own description over the generated sentence", async () => {
      mockGetPublicProfile.mockResolvedValueOnce({
        id: "s1",
        slug: "alpha-manufaktur",
        companyName: "Alpha Manufaktur",
        description: "Handgewebte Stoffe aus dem Allgäu.",
        certifications: [],
      })

      const meta = await generateMetadata({
        searchParams: Promise.resolve({ slug: "alpha-manufaktur" }),
      })

      expect(meta.description).toBe("Handgewebte Stoffe aus dem Allgäu.")
    })

    it("populates OpenGraph so shared links preview with the company name", async () => {
      mockGetPublicProfile.mockResolvedValueOnce({
        id: "s1",
        slug: "alpha-manufaktur",
        companyName: "Alpha Manufaktur",
        certifications: [],
      })

      const meta = await generateMetadata({
        searchParams: Promise.resolve({ slug: "alpha-manufaktur" }),
      })

      expect(meta.openGraph).toMatchObject({ type: "profile", title: "Alpha Manufaktur" })
    })

    it("falls back to a generic title when the slug 404s (unknown or not APPROVED)", async () => {
      mockGetPublicProfile.mockRejectedValueOnce(new Error("Not found"))
      const meta = await generateMetadata({ searchParams: Promise.resolve({ slug: "ghost" }) })
      expect(meta.title).toBe("Produzent")
    })

    it("takes the slug path when both slug and id are present", async () => {
      mockGetPublicProfile.mockResolvedValueOnce({
        id: "s1",
        slug: "alpha-manufaktur",
        companyName: "Alpha Manufaktur",
        certifications: [],
      })

      const meta = await generateMetadata({
        searchParams: Promise.resolve({ slug: "alpha-manufaktur", id: "s1" }),
      })

      expect(meta.title).toBe("Alpha Manufaktur")
      expect(mockList).not.toHaveBeenCalled()
    })
  })
})
