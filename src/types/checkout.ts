// ── Checkout Types ───────────────────────────────────────────────────
export interface CheckoutAddressDTO {
  firstName: string
  lastName: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
}

export interface CheckoutDTO {
  shippingAddressId: string
  billingAddressId?: string
  billingSameAsShipping?: boolean
  billingAddress?: CheckoutAddressDTO
  paymentMethod: "STRIPE" | "INVOICE" | "MOCK"
}

export interface CheckoutStartResponse {
  cartId?: string
  ownershipType?: string
  /** Validated line items with nested product/variant summaries */
  items?: Array<{
    id?: string
    product?: { id: string; slug: string; name: string; primaryImage?: string }
    variant?: { id: string; sku: string }
    quantity: number
    unitPrice?: number
    lineTotal: number
    currency?: string
  }>
  shippingAddress?: CheckoutAddressDTO
  billingAddress?: CheckoutAddressDTO
  subtotal?: number
  shippingCost?: number
  tax?: number
  totalQuantity?: number
  currency?: string
}

export interface CheckoutCompleteResponse {
  orderId?: string
  orderNumber?: string
  orderStatus?: string
  paymentStatus?: string
  paymentMethod?: string
  completedAt?: string
  checkout?: CheckoutStartResponse
}
