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
  /** Validated line items — backend does NOT include productName; resolve via cart context */
  items?: Array<{
    cartItemId?: string
    productId?: string
    variantId?: string
    quantity: number
    unitPrice?: number
    /** Line total in euro (decimal). Backend field name: lineTotal */
    lineTotal: number
    currency?: string
  }>
  shippingAddress?: CheckoutAddressDTO
  /** Validated subtotal in euro (decimal) — includes tax. */
  subtotal?: number
  /** Shipping cost in euro (decimal). May be absent if not provided by backend. */
  shippingCost?: number
  /** Total tax amount in euro (decimal). May be absent if not provided by backend. */
  tax?: number
  totalQuantity?: number
  currency?: string
  readyToProceed?: boolean
  paymentIntentClientSecret?: string
}

export interface CheckoutCompleteResponse {
  completionId?: string
  orderId?: string
  orderNumber?: string
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  completedAt?: string
  checkout?: CheckoutStartResponse
}
