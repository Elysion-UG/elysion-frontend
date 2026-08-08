import type {
  CertificateStatus,
  CertificateType,
  ProductStatus,
  OrderGroupStatus,
  SellerPayoutAccountStatus,
  ShippingSlaStatus,
} from "@/src/types"
import {
  PRODUCT_STATUS_LABEL,
  ORDER_GROUP_STATUS_LABEL,
  CERTIFICATE_STATUS_LABEL,
  SHIPPING_SLA_STATUS_LABEL,
} from "@/src/lib/constants/status-labels"

export type Tab = "products" | "orders" | "settlements" | "certificates" | "profile"

export const certStatusLabel: Record<CertificateStatus, string> = CERTIFICATE_STATUS_LABEL

export const certStatusColor: Record<CertificateStatus, string> = {
  PENDING: "bg-warning-tint text-warning",
  VERIFIED: "bg-green-50 text-green-600",
  REJECTED: "bg-danger-tint text-danger",
  EXPIRED: "bg-secondary text-muted-foreground",
}

export const CERT_TYPES: CertificateType[] = ["ORGANIC", "FAIR_TRADE", "RECYCLED", "VEGAN"]

export const productStatusLabel: Record<ProductStatus, string> = PRODUCT_STATUS_LABEL

export const productStatusColor: Record<ProductStatus, string> = {
  DRAFT: "bg-secondary text-foreground",
  REVIEW: "bg-warning-tint text-warning",
  ACTIVE: "bg-green-50 text-green-600",
  INACTIVE: "bg-secondary text-muted-foreground",
  REJECTED: "bg-danger-tint text-danger",
}

export const orderStatusLabel: Record<OrderGroupStatus, string> = ORDER_GROUP_STATUS_LABEL

export const orderStatusColor: Record<OrderGroupStatus, string> = {
  PENDING: "bg-warning-tint text-warning",
  CONFIRMED: "bg-info-tint text-info",
  PROCESSING: "bg-warning-tint text-warning",
  SHIPPED: "bg-secondary text-foreground",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-danger-tint text-danger",
}

// ── Versand-SLA (read-only, Backend #143) ────────────────────────────
// NOT_APPLICABLE wird nie gerendert (siehe hasShippingSla) und bekommt deshalb
// keine eigene Farbe; der Eintrag existiert nur, damit der Record vollständig ist.
export const shippingSlaLabel: Record<ShippingSlaStatus, string> = SHIPPING_SLA_STATUS_LABEL

// Eine laufende Frist ist kein Missstand, sondern der Normalfall — deshalb
// `info` und nicht `warning`. Damit bleibt Amber dem einen Zustand vorbehalten,
// der tatsächlich schiefging und nicht mehr zu retten ist: `MISSED`
// („Verspätet versandt"). `BREACHED` ist die einzige Lage, die der Verkäufer
// noch abwenden kann, und deshalb als einzige rot.
export const shippingSlaColor: Record<ShippingSlaStatus, string> = {
  NOT_APPLICABLE: "bg-secondary text-muted-foreground",
  PENDING: "bg-info-tint text-info",
  BREACHED: "bg-danger-tint text-danger",
  MET: "bg-green-50 text-green-700",
  MISSED: "bg-warning-tint text-warning",
}

// Shared seller table styling (light theme)
export const SELLER_TABLE_HEAD_CLASS =
  "px-6 py-3 text-xs font-medium uppercase text-muted-foreground"
export const SELLER_TABLE_CELL_CLASS = "px-6 py-4"

export const settlementStatusLabel: Record<string, string> = {
  PAID: "Bezahlt",
  PENDING: "Ausstehend",
}

export const settlementStatusColor: Record<string, string> = {
  PAID: "bg-green-50 text-green-700",
  PENDING: "bg-warning-tint text-warning",
}

// ── Payout-Account (Stripe Connect Express, light theme) ──────────────
export const payoutAccountStatusLabel: Record<SellerPayoutAccountStatus, string> = {
  NOT_CONNECTED: "Nicht verbunden",
  PENDING: "In Einrichtung",
  ACTIVE: "Aktiv",
  RESTRICTED: "Eingeschränkt",
}

export const payoutAccountStatusColor: Record<SellerPayoutAccountStatus, string> = {
  NOT_CONNECTED: "bg-secondary text-foreground",
  PENDING: "bg-warning-tint text-warning",
  ACTIVE: "bg-green-50 text-green-600",
  RESTRICTED: "bg-danger-tint text-danger",
}
