/**
 * ProductService — API calls for products.
 *
 * Public endpoints (no auth):
 *   GET /api/v1/products            — paginated list (Spring Page format, NOT wrapped)
 *   GET /api/v1/products/{slug}     — public storefront detail (wrapped ApiResponse)
 *
 * Authenticated:
 *   GET /api/v1/products/{id}       — internal UUID detail (raw, NOT wrapped)
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
 *   - Product list and internal UUID detail return raw objects (no ApiResponse wrapper)
 *     → use apiRequestRaw (returns body as-is) instead of apiRequest (which extracts body.data)
 *   - All other endpoints return wrapped ApiResponse → apiRequest unwraps to data field
 */
import { apiRequest, apiRequestRaw } from "@/src/lib/api-client"
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
    return apiRequestRaw(`/api/v1/products${qs ? `?${qs}` : ""}`)
  },

  async getBySlug(slug: string): Promise<ProductDetail> {
    return apiRequest(`/api/v1/products/${slug}`)
  },

  // ── Authenticated ─────────────────────────────────────────────────

  async getById(id: string): Promise<ProductInternalDetail> {
    return apiRequest(`/api/v1/products/${id}`)
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
