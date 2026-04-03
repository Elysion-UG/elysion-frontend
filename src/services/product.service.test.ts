import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { ProductService } from "./product.service"

vi.mock("@/src/lib/api-client", () => ({
  apiRequest: vi.fn(),
  apiUpload: vi.fn(),
}))

const mockApiRequest = vi.mocked(apiRequest)

// Raw API shape that the backend actually returns inside data{}
const mockApiProductPage = {
  items: [],
  page: 0,
  size: 10,
  totalItems: 0,
  totalPages: 0,
}

// Normalised internal shape after ProductService.list() transforms the response
const mockProductPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 10,
  number: 0,
}

const mockProductDetail = {
  id: "prod_1",
  slug: "eco-shirt",
  name: "Eco Shirt",
  price: 29.99,
}

const mockProductInternalDetail = {
  id: "prod_1",
  title: "Eco Shirt",
  price: 29.99,
}

const mockCommandResponse = { id: "prod_1", slug: "eco-shirt" }

describe("ProductService", () => {
  beforeEach(() => vi.clearAllMocks())

  // ── list ────────────────────────────────────────────────────────────

  describe("list", () => {
    it("calls /api/v1/products with no query string when no params given", async () => {
      mockApiRequest.mockResolvedValue(mockApiProductPage)
      await ProductService.list()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/products")
    })

    it("appends search param", async () => {
      mockApiRequest.mockResolvedValue(mockApiProductPage)
      await ProductService.list({ search: "shirt" })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/products?search=shirt")
    })

    it("appends categoryId param", async () => {
      mockApiRequest.mockResolvedValue(mockApiProductPage)
      await ProductService.list({ categoryId: "cat_1" })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/products?categoryId=cat_1")
    })

    it("appends sellerId param", async () => {
      mockApiRequest.mockResolvedValue(mockApiProductPage)
      await ProductService.list({ sellerId: "sel_1" })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/products?sellerId=sel_1")
    })

    it("appends minPrice and maxPrice", async () => {
      mockApiRequest.mockResolvedValue(mockApiProductPage)
      await ProductService.list({ minPrice: 10, maxPrice: 100 })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/products?minPrice=10&maxPrice=100")
    })

    it("appends sort, page and size", async () => {
      mockApiRequest.mockResolvedValue(mockApiProductPage)
      await ProductService.list({ sort: "price,asc", page: 2, size: 20 })
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/products?sort=price%2Casc&page=2&size=20"
      )
    })

    it("appends all params together", async () => {
      mockApiRequest.mockResolvedValue(mockApiProductPage)
      await ProductService.list({
        search: "eco",
        categoryId: "cat_1",
        sellerId: "sel_1",
        minPrice: 5,
        maxPrice: 50,
        sort: "name",
        page: 1,
        size: 10,
      })
      const url = mockApiRequest.mock.calls[0][0] as string
      expect(url).toContain("search=eco")
      expect(url).toContain("categoryId=cat_1")
      expect(url).toContain("sellerId=sel_1")
      expect(url).toContain("minPrice=5")
      expect(url).toContain("maxPrice=50")
      expect(url).toContain("sort=name")
      expect(url).toContain("page=1")
      expect(url).toContain("size=10")
    })

    it("normalises raw API response to internal ProductPage shape", async () => {
      mockApiRequest.mockResolvedValue(mockApiProductPage)
      const result = await ProductService.list()
      expect(result).toEqual(mockProductPage)
    })

    it("maps primaryImage to imageUrls array", async () => {
      mockApiRequest.mockResolvedValue({
        ...mockApiProductPage,
        items: [
          {
            id: "p1",
            slug: "eco-shirt",
            name: "Eco Shirt",
            price: 29.9,
            currency: "EUR",
            primaryImage: "https://example.com/img.jpg",
            seller: null,
            createdAt: "2026-01-01T00:00:00Z",
            matchScore: null,
          },
        ],
        totalItems: 1,
      })
      const result = await ProductService.list()
      expect(result.content[0].imageUrls).toEqual(["https://example.com/img.jpg"])
    })

    it("maps seller.id to seller.userId", async () => {
      mockApiRequest.mockResolvedValue({
        ...mockApiProductPage,
        items: [
          {
            id: "p1",
            slug: "eco-shirt",
            name: "Eco Shirt",
            price: 29.9,
            currency: "EUR",
            primaryImage: null,
            seller: { id: "seller-uuid", companyName: "Eco Store" },
            createdAt: "2026-01-01T00:00:00Z",
            matchScore: null,
          },
        ],
        totalItems: 1,
      })
      const result = await ProductService.list()
      expect(result.content[0].seller).toEqual({
        userId: "seller-uuid",
        companyName: "Eco Store",
      })
    })

    it("maps pagination fields (totalItems→totalElements, page→number)", async () => {
      mockApiRequest.mockResolvedValue({
        items: [],
        page: 2,
        size: 12,
        totalItems: 42,
        totalPages: 4,
      })
      const result = await ProductService.list()
      expect(result.totalElements).toBe(42)
      expect(result.number).toBe(2)
      expect(result.totalPages).toBe(4)
      expect(result.size).toBe(12)
    })
  })

  // ── getBySlug ────────────────────────────────────────────────────────

  describe("getBySlug", () => {
    const rawDetail = {
      id: "prod_1",
      name: "Eco Shirt",
      slug: "eco-shirt",
      shortDescription: "A great shirt",
      price: 29.99,
      images: [{ url: "https://example.com/img.jpg", altText: "shirt", order: 0 }],
      variants: [
        {
          id: "var_1",
          sku: "SKU-L",
          price: 29.99,
          options: [{ type: "Größe", value: "L" }],
        },
      ],
      seller: { id: "seller-uuid", companyName: "Eco Store" },
      category: { id: "cat_1", name: "Clothing", slug: "clothing" },
    }

    it("calls /api/v1/products/{slug}", async () => {
      mockApiRequest.mockResolvedValue(rawDetail)
      await ProductService.getBySlug("eco-shirt")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/products/eco-shirt")
    })

    it("maps shortDescription to shortDesc", async () => {
      mockApiRequest.mockResolvedValue(rawDetail)
      const result = await ProductService.getBySlug("eco-shirt")
      expect(result.shortDesc).toBe("A great shirt")
    })

    it("maps seller.id to seller.userId", async () => {
      mockApiRequest.mockResolvedValue(rawDetail)
      const result = await ProductService.getBySlug("eco-shirt")
      expect(result.seller?.userId).toBe("seller-uuid")
      expect(result.seller?.companyName).toBe("Eco Store")
    })

    it("maps images[].order to images[].position", async () => {
      mockApiRequest.mockResolvedValue(rawDetail)
      const result = await ProductService.getBySlug("eco-shirt")
      expect(result.images?.[0]).toEqual({ url: "https://example.com/img.jpg", position: 0 })
    })

    it("passes through variant fields including stock when present", async () => {
      mockApiRequest.mockResolvedValue({
        ...rawDetail,
        variants: [{ id: "var_1", sku: "SKU-L", price: 29.99, stock: 5 }],
      })
      const result = await ProductService.getBySlug("eco-shirt")
      expect(result.variants?.[0].stock).toBe(5)
    })

    it("leaves variant stock undefined when API omits it", async () => {
      mockApiRequest.mockResolvedValue(rawDetail)
      const result = await ProductService.getBySlug("eco-shirt")
      expect(result.variants?.[0].stock).toBeUndefined()
    })
  })

  // ── getById ──────────────────────────────────────────────────────────

  describe("getById", () => {
    it("calls /api/v1/products/by-id/{id}", async () => {
      mockApiRequest.mockResolvedValue(mockProductInternalDetail)
      await ProductService.getById("prod_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/products/by-id/prod_1")
    })

    it("returns the internal product detail", async () => {
      mockApiRequest.mockResolvedValue(mockProductInternalDetail)
      const result = await ProductService.getById("prod_1")
      expect(result).toEqual(mockProductInternalDetail)
    })
  })

  // ── create ───────────────────────────────────────────────────────────

  describe("create", () => {
    const dto = { title: "New Shirt", price: 19.99, categoryId: "cat_1" } as any

    it("POSTs to /api/v1/products with the dto body", async () => {
      mockApiRequest.mockResolvedValue(mockCommandResponse)
      await ProductService.create(dto)
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/products",
        expect.objectContaining({ method: "POST", body: JSON.stringify(dto) })
      )
    })

    it("returns the command response", async () => {
      mockApiRequest.mockResolvedValue(mockCommandResponse)
      const result = await ProductService.create(dto)
      expect(result).toEqual(mockCommandResponse)
    })
  })

  // ── update ───────────────────────────────────────────────────────────

  describe("update", () => {
    const dto = { title: "Updated Shirt" } as any

    it("PATCHes /api/v1/products/{id} with the dto body", async () => {
      mockApiRequest.mockResolvedValue(mockCommandResponse)
      await ProductService.update("prod_1", dto)
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/products/prod_1",
        expect.objectContaining({ method: "PATCH", body: JSON.stringify(dto) })
      )
    })
  })

  // ── updateStatus ─────────────────────────────────────────────────────

  describe("updateStatus", () => {
    const dto = { status: "ACTIVE" } as any

    it("PATCHes /api/v1/products/{id}/status", async () => {
      mockApiRequest.mockResolvedValue(mockCommandResponse)
      await ProductService.updateStatus("prod_1", dto)
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/products/prod_1/status",
        expect.objectContaining({ method: "PATCH", body: JSON.stringify(dto) })
      )
    })
  })

  // ── addImage ─────────────────────────────────────────────────────────

  describe("addImage", () => {
    const dto = { url: "https://example.com/img.jpg", altText: "shirt" } as any

    it("POSTs to /api/v1/products/{id}/images", async () => {
      mockApiRequest.mockResolvedValue(null)
      await ProductService.addImage("prod_1", dto)
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/products/prod_1/images",
        expect.objectContaining({ method: "POST", body: JSON.stringify(dto) })
      )
    })
  })

  // ── deleteImage ──────────────────────────────────────────────────────

  describe("deleteImage", () => {
    it("DELETEs /api/v1/products/{productId}/images/{imageId}", async () => {
      mockApiRequest.mockResolvedValue(null)
      await ProductService.deleteImage("prod_1", "img_1")
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/products/prod_1/images/img_1",
        expect.objectContaining({ method: "DELETE" })
      )
    })
  })

  // ── reorderImages ────────────────────────────────────────────────────

  describe("reorderImages", () => {
    const dto = { imageIds: ["img_2", "img_1"] } as any

    it("PATCHes /api/v1/products/{id}/images/order", async () => {
      mockApiRequest.mockResolvedValue(null)
      await ProductService.reorderImages("prod_1", dto)
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/products/prod_1/images/order",
        expect.objectContaining({ method: "PATCH", body: JSON.stringify(dto) })
      )
    })
  })

  // ── addVariant ───────────────────────────────────────────────────────

  describe("addVariant", () => {
    const dto = { sku: "SKU-001", stock: 10 } as any

    it("POSTs to /api/v1/products/{productId}/variants", async () => {
      mockApiRequest.mockResolvedValue({ id: "var_1", sku: "SKU-001" })
      await ProductService.addVariant("prod_1", dto)
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/products/prod_1/variants",
        expect.objectContaining({ method: "POST", body: JSON.stringify(dto) })
      )
    })

    it("returns the variant id and sku", async () => {
      mockApiRequest.mockResolvedValue({ id: "var_1", sku: "SKU-001" })
      const result = await ProductService.addVariant("prod_1", dto)
      expect(result).toEqual({ id: "var_1", sku: "SKU-001" })
    })
  })

  // ── updateVariant ────────────────────────────────────────────────────

  describe("updateVariant", () => {
    const dto = { stock: 5 }

    it("PATCHes /api/v1/products/{productId}/variants/{variantId}", async () => {
      mockApiRequest.mockResolvedValue({ id: "var_1", sku: "SKU-001" })
      await ProductService.updateVariant("prod_1", "var_1", dto)
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/products/prod_1/variants/var_1",
        expect.objectContaining({ method: "PATCH", body: JSON.stringify(dto) })
      )
    })
  })

  // ── deleteVariant ────────────────────────────────────────────────────

  describe("deleteVariant", () => {
    it("DELETEs /api/v1/products/{productId}/variants/{variantId}", async () => {
      mockApiRequest.mockResolvedValue(null)
      await ProductService.deleteVariant("prod_1", "var_1")
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/products/prod_1/variants/var_1",
        expect.objectContaining({ method: "DELETE" })
      )
    })
  })

  // ── reserveVariant ───────────────────────────────────────────────────

  describe("reserveVariant", () => {
    it("POSTs to /api/v1/variants/{variantId}/reserve with quantity", async () => {
      mockApiRequest.mockResolvedValue(null)
      await ProductService.reserveVariant("var_1", 3)
      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/variants/var_1/reserve",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ quantity: 3 }),
        })
      )
    })
  })

  // ── getProductCertificates ───────────────────────────────────────────

  describe("getProductCertificates", () => {
    it("GETs /api/v1/products/{productId}/certificates", async () => {
      mockApiRequest.mockResolvedValue([])
      await ProductService.getProductCertificates("prod_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/products/prod_1/certificates")
    })

    it("returns the certificates array", async () => {
      const certs = [{ id: "cert_1", name: "GOTS" }]
      mockApiRequest.mockResolvedValue(certs)
      const result = await ProductService.getProductCertificates("prod_1")
      expect(result).toEqual(certs)
    })
  })
})
