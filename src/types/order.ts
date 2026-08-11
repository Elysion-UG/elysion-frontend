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
  /**
   * Aus dem eingefrorenen Snapshot (`product.variantId`) — die Bestellzeile
   * selbst trägt kein `variantId`.
   */
  variantId?: string
  quantity: number
  /** Price per unit in euro (decimal). Backend field: `unitPrice` */
  pricePerUnit: number
  /** Line total in euro (decimal). Backend field: `lineTotal` */
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
  /** Backend field: `shipping` */
  shippingCost?: number
  /**
   * `trackingNumber` ist nullable: das Backend liefert das Objekt auch dann,
   * wenn nur `deliveredAt` gesetzt ist.
   */
  shipment?: { trackingNumber: string | null; carrier?: string } | null
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
/**
 * Abrechnungszeile einer OrderGroup mit der **vollständigen Gebührenkette**
 * (`MANAGEMENT_DECISIONS.md` §1.1, Backend #140). Identischer Vertrag in
 * `GET /api/v1/seller/settlements` (eigene Zeilen) und
 * `GET /api/v1/admin/settlements`.
 *
 * ```
 * grossAmount − refundedAmount − platformFeeAmount − stripeFeeAmount
 *   − chargebackAmount = netAmount
 * ```
 *
 * Gerechnet wird die Kette **serverseitig**; das Frontend zeigt die Positionen
 * nur an. `refundFeeAmount` ist dabei **Teil von** `stripeFeeAmount` und wird
 * nie zusätzlich abgezogen — die eigene Position weist lediglich aus, welcher
 * Anteil der Ist-Gebühr ohne Gegenumsatz dasteht.
 *
 * Dem Verkäufer wird laut §1.1 der **Provisionssatz nicht** angezeigt, nur der
 * absolute Betrag.
 */
export interface Settlement {
  settlementId: string
  orderGroupId?: string
  sellerId: string
  /** Vom Käufer für die Gruppe gezahlt (`goodsAmount + shippingAmount`). */
  grossAmount: number
  /** Warenwert ohne Versand — die Bemessungsgrundlage der Provision. */
  goodsAmount: number
  /** Versandanteil — provisionsfrei, fließt ungekürzt an den Verkäufer. */
  shippingAmount: number
  /** Bereits erstatteter Betrag. */
  refundedAmount: number
  /** Provision von Elysion; bei Retoure anteilig gekürzt. */
  platformFeeAmount: number
  /** Ist-Gebühr aus der Stripe-Balance-Transaction; trägt der Verkäufer. */
  stripeFeeAmount: number
  /** Gebührenanteil ohne Gegenumsatz — **enthalten in** `stripeFeeAmount`. */
  refundFeeAmount: number
  /** Manuell gebuchter Chargeback-Abzug (Streitbetrag + Stripe-Gebühr). */
  chargebackAmount: number
  /** Auszahlbarer Rest; **darf negativ sein** (Verrechnung mit der nächsten Auszahlung). */
  netAmount: number
  currency?: string
  status: string
  adjustmentRequired?: boolean
  eligibleAt?: string
  createdAt: string
}
