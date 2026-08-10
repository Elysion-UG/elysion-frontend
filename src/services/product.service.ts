/**
 * ProductService — API calls for products.
 *
 * List and detail are public; writes are seller-only. Endpoint catalogue:
 * docs/api-integration.md.
 *
 * Two different path families, do not mix them up (#219):
 *   - reads   → /api/v1/products/…        (public + internal query controllers)
 *   - writes  → /api/v1/seller/products/… (SellerProduct*CommandController)
 * The read controllers expose GET only; a write against /api/v1/products dies
 * as 405 in the dispatcher.
 *
 * The list endpoint paginates with its own shape — data.items (not content),
 * data.totalItems (not totalElements), data.page (not number). list() normalises
 * that to ProductPage, so callers must never hit the endpoint directly.
 *
 * Public detail is addressed by {slug}; the internal by-id/{id} route requires
 * ADMIN or the owning SELLER. Both name the product field `name` — by-id has
 * never carried a `title`, the internal type derives it (see getById()).
 */
import { z } from "zod"
import { apiRequest, buildQuery } from "@/src/lib/api-client"
import { parseApiResponse } from "@/src/lib/api-schemas"
import { normalizePage } from "@/src/lib/normalize-page"
import type {
  Page,
  ProductListParams,
  ProductFacets,
  SellerFacet,
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
  // `slug` is nullish, not required: the backend always sends the key but sends
  // `null` for every seller that is not APPROVED (see the mapper below), and an
  // API that predates the field must not take the whole list down.
  seller: z
    .object({ id: z.string(), slug: z.string().nullish(), companyName: z.string() })
    .nullable(),
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

// ── Raw API schemas (filter facets) ───────────────────────────────────────────

const apiFacetValueSchema = z.object({
  value: z.string(),
  productCount: z.number(),
})

const apiProductFacetsSchema = z.object({
  colors: z.array(apiFacetValueSchema),
  sizes: z.array(apiFacetValueSchema),
})

const apiSellerFacetsSchema = z.array(
  z.object({
    id: z.string(),
    // Same null-means-not-APPROVED rule as the product-list seller summary.
    slug: z.string().nullish(),
    companyName: z.string(),
    productCount: z.number(),
  })
)

// ── Raw API schemas (detail endpoint) ─────────────────────────────────────────

const apiProductVariantSchema = z.object({
  id: z.string(),
  sku: z.string().optional(),
  price: z.number().nullish(),
  stock: z.number().optional(),
  // Backend #175: derived sellable flag on the public detail route. `stock` stays
  // optional because only internal/seller routes ever expose raw stock levels.
  inStock: z.boolean().optional(),
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
      slug: z.string().nullish(),
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

// ── Raw API schemas (internal by-id detail) ───────────────────────────────────
// Deliberately its own schema and not a reuse of apiProductDetailSchema: the
// internal route answers with a *different*, leaner DTO (backend
// `ProductDetailDto`) — no `title`, no `category`, no `taxRate`, no `variants`,
// but `materials`, `status` and the timestamps that the public detail omits.
// Sharing one schema would have to make every one of those optional and would
// stop catching drift on either route (#232).

const apiProductInternalDetailSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  // Same rename as the public detail: API `shortDescription` → internal `shortDesc`.
  shortDescription: z.string().nullish(),
  // Major units; this is the product's base price (`basePriceCents / 100`).
  price: z.number().nullish(),
  currency: z.string().nullish(),
  status: z.string().nullish(),
  materials: z.array(z.object({ id: z.string(), slug: z.string(), name: z.string() })).nullish(),
  // The route does not carry images today — the mapping is defensive so the
  // `order` → `position` rename lives next to its sibling in getBySlug() and
  // ProductImageManager keeps working should the DTO ever gain them.
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string(),
        altText: z.string().nullish(),
        order: z.number().nullish(),
      })
    )
    .optional(),
  // Same seller summary as the public reads, same `slug`-is-null-unless-APPROVED
  // rule. `companyName` is declared nullable by the backend purely defensively
  // (a product without a seller profile is excluded by the foreign key).
  seller: z
    .object({
      id: z.string(),
      slug: z.string().nullish(),
      companyName: z.string().nullish(),
    })
    .nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
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
        // Variant facets (#49): the size axis is `variantSize`, NOT `size` —
        // `size` is already the page size below.
        color: params.colors,
        variantSize: params.sizes,
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
      // `slug` is normalised to an explicit null: "the backend withheld the link
      // because the seller is not APPROVED" is a state producerHref() acts on,
      // not an absent field. companyName stays set either way.
      seller: item.seller?.id
        ? {
            userId: item.seller.id,
            slug: item.seller.slug ?? null,
            companyName: item.seller.companyName,
          }
        : undefined,
      createdAt: item.createdAt,
    }))
  },

  /**
   * Colour/size filter facet of the product list (#49).
   *
   * Values come back normalised (trimmed, lower case) and are passed back
   * verbatim as `colors` / `sizes` in {@link ProductService.list}. The facet is
   * **global** — it does not narrow down with the other active filters.
   */
  async listFacets(): Promise<ProductFacets> {
    return parseApiResponse(
      apiProductFacetsSchema,
      await apiRequest<unknown>("/api/v1/products/facets"),
      "product.listFacets"
    )
  },

  /**
   * Manufacturer facet of the product list (#50). Lives under `/api/v1/sellers`
   * on the backend but is purely a product-filter concern, so it sits next to
   * the colour/size facet rather than in the (authenticated) seller-profile
   * service. Alphabetical by `companyName`, not paginated.
   */
  async listSellerFacets(): Promise<SellerFacet[]> {
    return parseApiResponse(
      apiSellerFacetsSchema,
      await apiRequest<unknown>("/api/v1/sellers/facets"),
      "product.listSellerFacets"
    )
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
        inStock: v.inStock,
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
            slug: raw.seller.slug ?? null,
            companyName: raw.seller.companyName,
            firstName: raw.seller.firstName,
            lastName: raw.seller.lastName,
          }
        : undefined,
      category: raw.category ?? undefined,
    }
  },

  // ── Authenticated ─────────────────────────────────────────────────

  /**
   * Internal UUID read (`ADMIN` or the owning `SELLER`).
   *
   * Parses and maps like its public siblings instead of casting the raw
   * response (#232): the API says `seller.id`, the frontend type says
   * `seller.userId` — a cast let that mismatch through without a compiler or
   * schema complaint, and anyone reading `seller.userId` got `undefined`.
   *
   * `title` is derived from `name`: the route carries no separate title, and
   * `ProductInternalDetail` requires one — same fallback as list().
   */
  async getById(id: string): Promise<ProductInternalDetail> {
    const raw = parseApiResponse(
      apiProductInternalDetailSchema,
      await apiRequest<unknown>(`/api/v1/products/by-id/${id}`),
      "product.getById"
    )
    return {
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      title: raw.name,
      description: raw.description ?? undefined,
      shortDesc: raw.shortDescription ?? undefined,
      // The route reports exactly one price and it is the base price, so both
      // fields are fed from it — the seller form edits `basePrice`.
      price: raw.price ?? undefined,
      basePrice: raw.price ?? undefined,
      currency: raw.currency ?? undefined,
      status: raw.status ?? undefined,
      materials: raw.materials ?? undefined,
      images: raw.images?.map((img) => ({
        id: img.id,
        url: img.url,
        position: img.order ?? undefined,
      })),
      // `slug` normalised to an explicit null exactly like list()/getBySlug():
      // "the backend withheld the link because the seller is not APPROVED".
      seller: raw.seller
        ? {
            userId: raw.seller.id,
            slug: raw.seller.slug ?? null,
            companyName: raw.seller.companyName ?? undefined,
          }
        : undefined,
      createdAt: raw.createdAt ?? undefined,
      updatedAt: raw.updatedAt ?? undefined,
    }
  },

  // ── Seller commands (/api/v1/seller/products) ─────────────────────
  //
  // There is deliberately no delete() here: the backend exposes no
  // DELETE /api/v1/seller/products/{id} (see #219).
  //
  // updateStatus(id, { status: "INACTIVE" }) is not a substitute. The backend
  // state machine only allows DRAFT → REVIEW, REVIEW → ACTIVE|REJECTED and
  // ACTIVE ⇄ INACTIVE, so retiring a product works only from ACTIVE; a DRAFT,
  // REVIEW or REJECTED product currently cannot be removed or hidden at all.

  async create(dto: ProductCreateDTO): Promise<ProductCommandResponse> {
    return apiRequest("/api/v1/seller/products", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async update(id: string, dto: ProductUpdateDTO): Promise<ProductCommandResponse> {
    return apiRequest(`/api/v1/seller/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async updateStatus(id: string, dto: ProductStatusUpdateDTO): Promise<ProductCommandResponse> {
    return apiRequest(`/api/v1/seller/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async addImage(id: string, dto: ProductImageCreateDTO): Promise<null> {
    return apiRequest(`/api/v1/seller/products/${id}/images`, {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async deleteImage(productId: string, imageId: string): Promise<null> {
    return apiRequest(`/api/v1/seller/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    })
  },

  async reorderImages(id: string, dto: ProductImageReorderDTO): Promise<null> {
    return apiRequest(`/api/v1/seller/products/${id}/images/order`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async addVariant(
    productId: string,
    dto: ProductVariantInput
  ): Promise<{ id: string; sku: string }> {
    return apiRequest(`/api/v1/seller/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async updateVariant(
    productId: string,
    variantId: string,
    dto: Partial<ProductVariantInput>
  ): Promise<{ id: string; sku: string }> {
    return apiRequest(`/api/v1/seller/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async deleteVariant(productId: string, variantId: string): Promise<null> {
    return apiRequest(`/api/v1/seller/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
    })
  },
}
