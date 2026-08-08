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
  paymentStatus?: string
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

// ── Versand-SLA (read-only, Backend #143) ────────────────────────────
/**
 * Vom Server abgeleiteter Zustand der Versandfrist. Es gibt **keine** API-Aktion
 * dazu — der Verkäufer löst eine Überschreitung durch Versenden, nicht durch
 * Bestätigen.
 *
 * - `NOT_APPLICABLE` — keine Frist geschuldet (nicht captured, Altbestellung, storniert)
 * - `PENDING` — Frist läuft, nichts versandt
 * - `BREACHED` — Frist abgelaufen, nichts versandt
 * - `MET` — rechtzeitig versandt
 * - `MISSED` — versandt, aber nach der Frist
 */
export type ShippingSlaStatus = "NOT_APPLICABLE" | "PENDING" | "BREACHED" | "MET" | "MISSED"

export interface ShippingSla {
  status: ShippingSlaStatus
  /** Eingefrorene Versandfrist; `null` vor dem Zahlungseinzug. */
  deadlineAt: string | null
  /** Zeitpunkt der Eskalation an den Verkäufer; `null`, solange keine erfolgt ist. */
  breachedAt: string | null
}

/** Shipping address — only included by the backend for CONFIRMED/PROCESSING/SHIPPED orders. */
export interface ShippingAddress {
  firstName: string
  lastName: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
}

export interface OrderDetail {
  id?: string
  orderNumber?: string
  status?: OrderStatus
  createdAt?: string
  shippingAddress?: ShippingAddress
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
  subtotal?: number
  shipping?: number
  currency?: string
  shipment?: { trackingNumber: string; carrier?: string } | null
  /**
   * Read-only Versandfrist des Servers. Laut Vertrag immer vorhanden; ohne
   * Frist ist `deadlineAt` `null` und `status` `NOT_APPLICABLE`. Optional nur
   * als Defensive — fehlendes Feld zeigt genauso nichts an.
   */
  shippingSla?: ShippingSla
  buyer?: { userId?: string; guestEmail?: string | null }
  /** Provided by backend only for shippable order states. DSGVO: use only for shipping, not marketing. */
  shippingAddress?: ShippingAddress
  createdAt: string
}

export interface ShipOrderDTO {
  trackingNumber: string
  carrier?: string
}

// ── Settlements ───────────────────────────────────────────────────────
export interface Settlement {
  settlementId: string
  orderGroupId?: string
  sellerId: string
  grossAmount: number
  platformFeeAmount: number
  netAmount: number
  refundedAmount?: number
  currency?: string
  status: string
  adjustmentRequired?: boolean
  eligibleAt?: string
  createdAt: string
}
