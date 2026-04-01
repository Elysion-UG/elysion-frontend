// ── Cart Types ───────────────────────────────────────────────────────
export interface CartItem {
  id: string
  productId: string
  productName?: string
  productSlug?: string
  variantId?: string
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
