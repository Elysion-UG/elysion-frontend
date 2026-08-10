import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { ApiSchemaError } from "@/src/lib/api-schemas"
import { SellerProductService } from "./seller-product.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

// Shape von SellerProductListItemResponse — bewusst nicht das Katalog-DTO:
// `name` statt `title`, `primaryImage` als String, kein `seller`-Objekt.
const rawItem = {
  id: "prod_1",
  slug: "bio-shirt",
  name: "Bio-Shirt",
  status: "DRAFT",
  price: 29.99,
  currency: "EUR",
  primaryImage: null,
  createdAt: "2026-08-01T10:00:00Z",
}

function pageOf(items: unknown[], overrides: Record<string, number> = {}) {
  return {
    items,
    page: 0,
    size: 20,
    totalItems: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    ...overrides,
  }
}

describe("SellerProductService", () => {
  beforeEach(() => vi.clearAllMocks())

  describe("list", () => {
    it("requests /api/v1/seller/products without a query string when no params", async () => {
      mockApiRequest.mockResolvedValue(pageOf([]))
      await SellerProductService.list()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/products")
    })

    it("never sends a sellerId — the seller comes from the token", async () => {
      mockApiRequest.mockResolvedValue(pageOf([]))
      await SellerProductService.list({ page: 1, size: 20 })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/products?page=1&size=20")
    })

    it("appends the status filter", async () => {
      mockApiRequest.mockResolvedValue(pageOf([]))
      await SellerProductService.list({ status: "REVIEW", page: 0, size: 1 })
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/seller/products?status=REVIEW&page=0&size=1"
      )
    })

    it("maps the seller DTO onto SellerProductListItem", async () => {
      mockApiRequest.mockResolvedValue(pageOf([{ ...rawItem, primaryImage: "https://i/1.jpg" }]))
      const page = await SellerProductService.list()
      expect(page.items[0]).toEqual({
        id: "prod_1",
        slug: "bio-shirt",
        name: "Bio-Shirt",
        status: "DRAFT",
        price: 29.99,
        currency: "EUR",
        primaryImage: "https://i/1.jpg",
        createdAt: "2026-08-01T10:00:00Z",
      })
    })

    it("keeps a missing primary image as null", async () => {
      mockApiRequest.mockResolvedValue(pageOf([rawItem]))
      const page = await SellerProductService.list()
      expect(page.items[0].primaryImage).toBeNull()
    })

    it("carries non-ACTIVE statuses through — that is the whole point of this endpoint", async () => {
      mockApiRequest.mockResolvedValue(
        pageOf([
          { ...rawItem, id: "p1", status: "DRAFT" },
          { ...rawItem, id: "p2", status: "REVIEW" },
          { ...rawItem, id: "p3", status: "REJECTED" },
        ])
      )
      const page = await SellerProductService.list()
      expect(page.items.map((p) => p.status)).toEqual(["DRAFT", "REVIEW", "REJECTED"])
    })

    it("normalises the pagination envelope", async () => {
      mockApiRequest.mockResolvedValue(pageOf([rawItem], { page: 2, size: 20, totalItems: 45 }))
      const page = await SellerProductService.list({ page: 2 })
      expect(page.page).toBe(2)
      expect(page.size).toBe(20)
      expect(page.totalItems).toBe(45)
    })

    it("rejects an unknown status instead of rendering it", async () => {
      mockApiRequest.mockResolvedValue(pageOf([{ ...rawItem, status: "ARCHIVED" }]))
      await expect(SellerProductService.list()).rejects.toBeInstanceOf(ApiSchemaError)
    })

    it("rejects the catalogue DTO — `title` is not `name`", async () => {
      const { name: _name, ...withoutName } = rawItem
      mockApiRequest.mockResolvedValue(pageOf([{ ...withoutName, title: "Bio-Shirt" }]))
      await expect(SellerProductService.list()).rejects.toBeInstanceOf(ApiSchemaError)
    })
  })

  describe("countByStatus", () => {
    it("asks per status with size=1 and returns totalItems", async () => {
      mockApiRequest.mockImplementation(async (path: string) => {
        if (path.includes("status=ACTIVE")) return pageOf([rawItem], { totalItems: 7 })
        if (path.includes("status=DRAFT")) return pageOf([rawItem], { totalItems: 3 })
        return pageOf([], { totalItems: 0 })
      })

      const counts = await SellerProductService.countByStatus(["ACTIVE", "DRAFT", "REVIEW"])

      expect(counts).toEqual({ ACTIVE: 7, DRAFT: 3, REVIEW: 0 })
      expect(mockApiRequest).toHaveBeenCalledTimes(3)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/products?status=ACTIVE&size=1")
    })

    it("returns an empty record for an empty status list", async () => {
      await expect(SellerProductService.countByStatus([])).resolves.toEqual({})
      expect(mockApiRequest).not.toHaveBeenCalled()
    })
  })
})
