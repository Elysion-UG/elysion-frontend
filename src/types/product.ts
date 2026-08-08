import type { PublicCertificate } from "./certificate"
import type { Material } from "./material"

// ── Product Types ────────────────────────────────────────────────
export type ProductStatus = "DRAFT" | "REVIEW" | "ACTIVE" | "INACTIVE" | "REJECTED"

export interface ProductVariantOption {
  type: string
  value: string
}

export interface ProductVariant {
  id: string
  sku?: string
  size?: string
  color?: string
  material?: string
  /** Raw stock level — internal/seller routes only, never on the public detail route. */
  stock?: number
  /** Public detail route: whether this variant is currently sellable (stock − reserved > 0). */
  inStock?: boolean
  price?: number | null
  imageUrls?: string[]
  options?: ProductVariantOption[]
  available?: boolean
}

export interface ProductImage {
  id?: string
  url: string
  position?: number
}

export interface ProductSeller {
  userId?: string
  companyName?: string
  firstName?: string
  lastName?: string
}

export interface ProductDetail {
  id: string
  slug: string
  /** Public-facing product name */
  name: string
  /** Internal title used by seller (may equal name) */
  title?: string
  shortDesc?: string
  description?: string
  /** Base price in euros */
  basePrice?: number
  price?: number
  taxRate?: number
  currency?: string
  images?: ProductImage[]
  imageUrls?: string[]
  category?: { id?: string; name: string } | null
  categoryId?: string
  seller?: ProductSeller
  sellerId?: string
  status?: ProductStatus | string
  /** List API: whether the product is currently sellable. The detail view uses the per-variant `inStock` instead. */
  inStock?: boolean
  variants?: ProductVariant[]
  certificates?: PublicCertificate[]
  materials?: Material[]
  createdAt?: string
  updatedAt?: string
}

export interface ProductInternalDetail extends ProductDetail {
  title: string
}

/** Lightweight product item used in listing pages */
export interface ProductListItem {
  id: string
  slug?: string
  title?: string
  name?: string
  price?: number
  basePrice?: number
  imageUrl?: string
  images?: ProductImage[]
  status?: ProductStatus | string
  sellerId?: string
  createdAt?: string
}

export interface ProductListParams {
  search?: string
  categoryId?: string
  /**
   * Seller UUID(s). Repeatable manufacturer filter — a product matches when it
   * belongs to *any* of the supplied sellers (OR within the axis, AND with the
   * other filters). A single string keeps the pre-#50 behaviour.
   */
  sellerId?: string | string[]
  minPrice?: number
  maxPrice?: number
  /** Material slugs; a product matches when linked to any of them. */
  materials?: string[]
  /**
   * Variant colour values, taken verbatim from `GET /api/v1/products/facets`.
   * Serialised as the repeatable `color` param. OR within the axis.
   */
  colors?: string[]
  /**
   * Variant size values, taken verbatim from `GET /api/v1/products/facets`.
   * Serialised as the repeatable **`variantSize`** param — *not* `size`, which
   * is already the page size of the list endpoint. OR within the axis;
   * `colors` and `sizes` combine with AND.
   */
  sizes?: string[]
  sort?: string
  page?: number
  size?: number
}

// ── Filter facets ────────────────────────────────────────────────────────────

/** One selectable value of a product filter axis plus the products behind it. */
export interface ProductFacetValue {
  /** Normalised (trimmed, lower case) — pass back verbatim as a filter value. */
  value: string
  /** Number of ACTIVE *products* (not variants) carrying this value. */
  productCount: number
}

/**
 * `GET /api/v1/products/facets` — selectable colours and sizes.
 *
 * The facet is **global**: it does not narrow down with the other filters that
 * are currently applied, so the UI must not suggest otherwise. Both axes are
 * always present; an axis without values is an empty array.
 */
export interface ProductFacets {
  colors: ProductFacetValue[]
  sizes: ProductFacetValue[]
}

/** One entry of `GET /api/v1/sellers/facets` — a manufacturer filter option. */
export interface SellerFacet {
  /** Seller UUID — exactly the value for `GET /api/v1/products?sellerId=<id>`. */
  id: string
  companyName: string
  /** Number of ACTIVE products of this manufacturer. */
  productCount: number
}

export interface ProductCreateDTO {
  name?: string
  title?: string
  description?: string
  shortDesc?: string
  basePrice?: number
  price?: number
  taxRate?: number
  currency?: string
  categoryId?: string
  imageUrls?: string[]
  /** Material UUIDs to assign on create. */
  materialIds?: string[]
}

export interface ProductUpdateDTO {
  name?: string
  title?: string
  description?: string
  shortDesc?: string
  basePrice?: number
  price?: number
  taxRate?: number
  currency?: string
  categoryId?: string
  /** null/omitted = unchanged; any array (incl. []) = replace assignment. */
  materialIds?: string[]
}

export interface ProductStatusUpdateDTO {
  status: ProductStatus | string
}

export interface ProductCommandResponse {
  id: string
  status: string
}

export interface ProductImageCreateDTO {
  fileId: string
  altText?: string
  order?: number
}

export interface ProductImageReorderDTO {
  imageIds: string[]
}

export interface ProductVariantInput {
  sku?: string
  size?: string
  color?: string
  material?: string
  stock: number
  price: number
  imageUrls?: string[]
}
