// ── Cart Types ───────────────────────────────────────────────────────
export interface CartItem {
  id: string
  productId: string
  productName?: string
  productSlug?: string
  variantId?: string
  /** Backend field: variant SKU from the server-owned line display data */
  variantSku?: string
  /**
   * Human-readable variant labels. Server-owned: the backend delivers them as
   * `{ type, value }` (free text, e.g. `COLOR: Rot`), the cart service maps
   * `type` → `name`. Never inferred from a local cache.
   */
  variantOptions?: Array<{ name: string; value: string }>
  name?: string
  imageUrl?: string
  quantity: number
  unitPrice?: number
  unitPriceCents?: number
  totalPrice?: number
  totalPriceCents?: number
  /** Backend field: unit price in euro (decimal) */
  priceSnapshot?: number
  /** Backend field: line total in euro (decimal) */
  lineTotal?: number
  /** Backend field: ISO 4217 code of the line */
  currency?: string
}

export interface Cart {
  id?: string
  items: CartItem[]
  totalAmount?: number
  subtotalCents?: number
  itemCount?: number
}

export interface AddToCartDTO {
  productId: string
  variantId?: string
  quantity: number
  /** Display fields — used to populate the optimistic cart item for guests */
  productName?: string
  productSlug?: string
  imageUrl?: string
  /** Price in cents — used to show the correct price in the guest cart */
  unitPriceCents?: number
  /** Human-readable variant labels (e.g. [{name:"Größe",value:"XL"}]) */
  variantOptions?: Array<{ name: string; value: string }>
}

export interface UpdateCartItemDTO {
  quantity: number
}
