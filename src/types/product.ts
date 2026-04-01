import type { PublicCertificate } from "./certificate"

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
  stock?: number
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
  variants?: ProductVariant[]
  certificates?: PublicCertificate[]
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
  sellerId?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  page?: number
  size?: number
}

export interface ProductPage {
  content: ProductDetail[]
  totalElements: number
  totalPages: number
  size: number
  number: number
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
}

export interface ProductStatusUpdateDTO {
  status: ProductStatus | string
}

export interface ProductCommandResponse {
  id: string
  status: string
}

export interface ProductImageCreateDTO {
  imageUrl: string
  position?: number
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
