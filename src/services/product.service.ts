/**
 * ProductService — API calls for products.
 *
 * List and detail are public; writes are seller-only. Endpoint catalogue:
 * docs/api-integration.md.
 *
 * The list endpoint paginates with its own shape — data.items (not content),
 * data.totalItems (not totalElements), data.page (not number). list() normalises
 * that to ProductPage, so callers must never hit the endpoint directly.
 *
 * Public detail is addressed by {slug} and returns `name`; the internal
 * by-id/{id} route returns `title` and requires ADMIN or the owning SELLER.
 */
import { z } from "zod"
import { apiRequest, buildQuery } from "@/src/lib/api-client"
import { parseApiResponse } from "@/src/lib/api-schemas"
import { normalizePage } from "@/src/lib/normalize-page"
import type {
  Page,
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

// ── Raw API schemas (list endpoint) ───────────────────────────────────────────
// Zod mirrors the JSON the backend returns inside data{} (same required/optional
// shape as the previous interfaces) and is validated at the boundary before the
// response is normalised, so contract drift fails loud instead of surfacing as
// `undefined.foo` deep in the shop UI (#38).

const apiProductListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  price: z.number(),
  currency: z.string(),
  primaryImage: z.string().nullable(),
  seller: z.object({ id: z.string(), companyName: z.string() }).nullable(),
  createdAt: z.string(),
  matchScore: z.number().nullable(),
  status: z.string().optional(),
  inStock: z.boolean().optional(),
})

const apiProductPageSchema = z.object({
  items: z.array(apiProductListItemSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
})

// ── Raw API schemas (detail endpoint) ─────────────────────────────────────────

const apiProductVariantSchema = z.object({
  id: z.string(),
  sku: z.string().optional(),
  price: z.number().nullish(),
  stock: z.number().optional(),
  available: z.boolean().optional(),
  imageUrls: z.array(z.string()).optional(),
  options: z.array(z.object({ type: z.string(), value: z.string() })).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
})

const apiProductDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  // API uses shortDescription, internal type uses shortDesc
  shortDescription: z.string().optional(),
  price: z.number().optional(),
  basePrice: z.number().optional(),
  currency: z.string().optional(),
  taxRate: z.number().optional(),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string(),
        altText: z.string().optional(),
        order: z.number().optional(),
      })
    )
    .optional(),
  variants: z.array(apiProductVariantSchema).optional(),
  seller: z
    .object({
      id: z.string(),
      companyName: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
    .nullish(),
  category: z
    .object({ id: z.string().optional(), name: z.string(), slug: z.string().optional() })
    .nullish(),
  matchScore: z.number().nullish(),
  matchBreakdown: z.unknown().optional(),
})

export const ProductService = {
  // ── Public ────────────────────────────────────────────────────────

  async list(params: ProductListParams = {}): Promise<Page<ProductDetail>> {
    const raw = await apiRequest<unknown>(
      `/api/v1/products${buildQuery({
        search: params.search,
        categoryId: params.categoryId,
        sellerId: params.sellerId,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        // Backend expects the repeatable param name `material`.
        material: params.materials,
        sort: params.sort,
        page: params.page,
        size: params.size,
      })}`
    )
    const page = parseApiResponse(apiProductPageSchema, raw, "product.list")
    return normalizePage(page, (item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      title: item.name,
      price: item.price,
      currency: item.currency,
      status: item.status,
      // Backend reports availability per list item; absent (older API) → assume available.
      inStock: item.inStock ?? true,
      imageUrls: item.primaryImage ? [item.primaryImage] : undefined,
      seller: item.seller?.id
        ? { userId: item.seller.id, companyName: item.seller.companyName }
        : undefined,
      createdAt: item.createdAt,
    }))
  },

  async getBySlug(slug: string): Promise<ProductDetail> {
    const raw = parseApiResponse(
      apiProductDetailSchema,
      await apiRequest<unknown>(`/api/v1/products/${slug}`),
      "product.getBySlug"
    )
    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      title: raw.title,
      description: raw.description,
      shortDesc: raw.shortDescription,
      price: raw.price,
      basePrice: raw.basePrice,
      currency: raw.currency,
      taxRate: raw.taxRate,
      images: raw.images?.map((img) => ({ id: img.id, url: img.url, position: img.order })),
      variants: raw.variants?.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        available: v.available,
        imageUrls: v.imageUrls,
        options: v.options,
        size: v.size,
        color: v.color,
        material: v.material,
      })),
      seller: raw.seller
        ? {
            userId: raw.seller.id,
            companyName: raw.seller.companyName,
            firstName: raw.seller.firstName,
            lastName: raw.seller.lastName,
          }
        : undefined,
      category: raw.category ?? undefined,
    }
  },

  // ── Authenticated ─────────────────────────────────────────────────

  async getById(id: string): Promise<ProductInternalDetail> {
    return apiRequest<ProductInternalDetail>(`/api/v1/products/by-id/${id}`)
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

  async delete(id: string): Promise<void> {
    return apiRequest(`/api/v1/products/${id}`, { method: "DELETE" })
  },
}
