// ── Order Types ──────────────────────────────────────────────────────
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"

export interface Order {
  id: string
  orderNumber?: string
  status: OrderStatus
  total?: number
  currency?: string
  createdAt: string
}

/** Frozen product/variant data captured at purchase time. */
export interface OrderProductSnapshot {
  productId?: string
  productName?: string
  productSlug?: string
  sellerId?: string
  variantId?: string
  sku?: string
  /** Variant options — backend field: options[].type / options[].value */
  options?: Array<{ type: string; value: string }>
  currency?: string
}

export interface OrderItem {
  id: string
  variantId?: string
  quantity: number
  /** Price per unit in euro (decimal). Backend field: pricePerUnit */
  pricePerUnit: number
  /** Line total in euro (decimal). Backend field: subtotal */
  subtotal: number
  productSnapshot?: OrderProductSnapshot
}

// ── Order Group (Seller) ─────────────────────────────────────────────
export type OrderGroupStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"

export interface OrderGroup {
  id: string
  sellerId?: string
  status: OrderGroupStatus
  subtotal?: number
  shippingCost?: number
  shipment?: { trackingNumber: string; carrier?: string } | null
  items: OrderItem[]
}

export interface OrderDetail {
  id?: string
  orderNumber?: string
  status?: OrderStatus
  createdAt?: string
  shippingAddress?: {
    firstName: string
    lastName: string
    street: string
    houseNumber: string
    postalCode: string
    city: string
    country: string
  }
  groups?: OrderGroup[]
  subtotal?: number
  shippingCost?: number
  tax?: number | null
  total?: number
  currency?: string
}

export interface OrderGroupDetail {
  orderGroupId: string
  orderId: string
  status: OrderGroupStatus
  items: Array<{
    id: string
    variantId?: string
    quantity: number
    pricePerUnit?: number
    subtotal?: number
    productSnapshot?: {
      productId?: string
      productName?: string
      productSlug?: string
      sellerId?: string
      variantId?: string
      sku?: string
      options?: Array<{ type: string; value: string }>
      currency?: string
    }
    createdAt?: string
    updatedAt?: string
  }>
  totalAmount: number
  currency?: string
  shipment?: { trackingNumber: string; carrier?: string } | null
  buyer?: { userId?: string; guestEmail?: string | null }
  createdAt: string
}

export interface OrderGroupsPage {
  items: OrderGroupDetail[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ShipOrderDTO {
  trackingNumber: string
  carrier?: string
}

// ── Settlements ───────────────────────────────────────────────────────
export interface Settlement {
  id: string
  sellerId: string
  orderGroupId?: string
  periodStart: string
  periodEnd: string
  grossAmountCents: number
  platformFeeCents: number
  netAmountCents: number
  amount?: number
  status: "PENDING" | "PAID"
  paidAt?: string
  createdAt: string
}

export interface SettlementsPage {
  items: Settlement[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
