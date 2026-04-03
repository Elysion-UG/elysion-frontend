/**
 * ProductService — API calls for products.
 *
 * Public endpoints (no auth):
 *   GET /api/v1/products            — paginated list (wrapped ApiResponse, custom pagination)
 *   GET /api/v1/products/{slug}     — public storefront detail (wrapped ApiResponse)
 *
 * Authenticated:
 *   GET /api/v1/products/by-id/{id} — internal UUID detail (wrapped ApiResponse)
 *
 * Seller-only:
 *   POST   /api/v1/products                              — create product
 *   PATCH  /api/v1/products/{id}                         — update product
 *   PATCH  /api/v1/products/{id}/status                  — status transition
 *   POST   /api/v1/products/{id}/images                  — add image
 *   DELETE /api/v1/products/{id}/images/{imageId}        — remove image
 *   PATCH  /api/v1/products/{id}/images/order            — reorder images
 *   POST   /api/v1/products/{id}/variants                — add variant
 *   PATCH  /api/v1/products/{id}/variants/{variantId}    — update variant
 *   DELETE /api/v1/products/{id}/variants/{variantId}    — delete variant
 *
 * Note on response styles:
 *   - All endpoints return a wrapped ApiResponse { status, message, data }
 *     → use apiRequest (extracts body.data) for all calls
 *   - The list endpoint uses a custom pagination shape:
 *     data.items (not content), data.totalItems (not totalElements), data.page (not number)
 *     → ProductService.list() normalises this to the internal ProductPage type
 */
import { apiRequest } from "@/src/lib/api-client"

// ── Raw API types (list endpoint) ─────────────────────────────────────────────
// These reflect the actual JSON the backend returns inside data{}.
// They are normalised to internal types before leaving this module.

interface ApiProductListItem {
  id: string
  slug: string
  name: string
  price: number
  currency: string
  primaryImage: string | null
  seller: { id: string; companyName: string } | null
  createdAt: string
  matchScore: number | null
}

interface ApiProductPage {
  items: ApiProductListItem[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}
import type {
  ProductPage,
  ProductListParams,
  ProductDetail,
  ProductInternalDetail,
  ProductCreateDTO,
  ProductUpdateDTO,
  ProductStatusUpdateDTO,
  ProductCommandResponse,
  ProductImageCreateDTO,
  ProductImageReorderDTO,
  ProductVariantInput,
} from "@/src/types"

export const ProductService = {
  // ── Public ────────────────────────────────────────────────────────

  async list(params: ProductListParams = {}): Promise<ProductPage> {
    const query = new URLSearchParams()
    if (params.search) query.set("search", params.search)
    if (params.categoryId) query.set("categoryId", params.categoryId)
    if (params.sellerId) query.set("sellerId", params.sellerId)
    if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice))
    if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice))
    if (params.sort) query.set("sort", params.sort)
    if (params.page !== undefined) query.set("page", String(params.page))
    if (params.size !== undefined) query.set("size", String(params.size))
    const qs = query.toString()
    const raw = await apiRequest<ApiProductPage>(`/api/v1/products${qs ? `?${qs}` : ""}`)
    return {
      content: raw.items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        price: item.price,
        currency: item.currency,
        imageUrls: item.primaryImage ? [item.primaryImage] : undefined,
        seller: item.seller
          ? { userId: item.seller.id, companyName: item.seller.companyName }
          : undefined,
        createdAt: item.createdAt,
      })),
      totalElements: raw.totalItems,
      totalPages: raw.totalPages,
      size: raw.size,
      number: raw.page,
    }
  },

  async getBySlug(slug: string): Promise<ProductDetail> {
    return apiRequest(`/api/v1/products/${slug}`)
  },

  // ── Authenticated ─────────────────────────────────────────────────

  async getById(id: string): Promise<ProductInternalDetail> {
    return apiRequest(`/api/v1/products/by-id/${id}`)
  },

  // ── Seller commands ───────────────────────────────────────────────

  async create(dto: ProductCreateDTO): Promise<ProductCommandResponse> {
    return apiRequest("/api/v1/products", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async update(id: string, dto: ProductUpdateDTO): Promise<ProductCommandResponse> {
    return apiRequest(`/api/v1/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async updateStatus(id: string, dto: ProductStatusUpdateDTO): Promise<ProductCommandResponse> {
    return apiRequest(`/api/v1/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async addImage(id: string, dto: ProductImageCreateDTO): Promise<null> {
    return apiRequest(`/api/v1/products/${id}/images`, {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async deleteImage(productId: string, imageId: string): Promise<null> {
    return apiRequest(`/api/v1/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    })
  },

  async reorderImages(id: string, dto: ProductImageReorderDTO): Promise<null> {
    return apiRequest(`/api/v1/products/${id}/images/order`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async addVariant(
    productId: string,
    dto: ProductVariantInput
  ): Promise<{ id: string; sku: string }> {
    return apiRequest(`/api/v1/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async updateVariant(
    productId: string,
    variantId: string,
    dto: Partial<ProductVariantInput>
  ): Promise<{ id: string; sku: string }> {
    return apiRequest(`/api/v1/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async deleteVariant(productId: string, variantId: string): Promise<null> {
    return apiRequest(`/api/v1/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
    })
  },

  async reserveVariant(variantId: string, quantity: number): Promise<null> {
    return apiRequest(`/api/v1/variants/${variantId}/reserve`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
    })
  },

  async getProductCertificates(productId: string): Promise<unknown[]> {
    return apiRequest(`/api/v1/products/${productId}/certificates`)
  },
}
