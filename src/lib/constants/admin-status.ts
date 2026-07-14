import type {
  AccountStatus,
  UserRole,
  OrderStatus,
  OrderGroupStatus,
  ProductStatus,
  SellerStatus,
  CertificateStatus,
} from "@/src/types"
import {
  PRODUCT_STATUS_LABEL,
  ORDER_GROUP_STATUS_LABEL,
  CERTIFICATE_STATUS_LABEL,
} from "./status-labels"

// ── Account Status ──────────────────────────────────────────────────
export const ADMIN_ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  PENDING: "Ausstehend",
  PENDING_VERIFICATION: "Nicht verifiziert",
  ACTIVE: "Aktiv",
  SUSPENDED: "Gesperrt",
  DELETED: "Gelöscht",
}

export const ADMIN_ACCOUNT_STATUS_COLOR: Record<AccountStatus, string> = {
  PENDING: "bg-warning/40 text-warning ring-1 ring-warning/40",
  PENDING_VERIFICATION: "bg-warning/40 text-warning ring-1 ring-warning/40",
  ACTIVE: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  SUSPENDED: "bg-destructive/40 text-danger ring-1 ring-danger/40",
  DELETED: "bg-ink-900 text-muted-foreground",
}

// ── User Role ───────────────────────────────────────────────────────
export const ADMIN_ROLE_COLOR: Record<UserRole, string> = {
  BUYER: "bg-ink-900 text-muted-foreground",
  SELLER: "bg-green-700/50 text-green-500 ring-1 ring-green-500/40",
  ADMIN: "bg-info/50 text-info ring-1 ring-info/40",
}

// ── Order Status ────────────────────────────────────────────────────
export const ADMIN_ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Zahlung ausstehend",
  PENDING: "Ausstehend",
  PAID: "Bezahlt",
  CONFIRMED: "Bestätigt",
  PROCESSING: "In Bearbeitung",
  SHIPPED: "Versandt",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
  REFUNDED: "Erstattet",
}

export const ADMIN_ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-warning/40 text-warning ring-1 ring-warning/40",
  PENDING: "bg-warning/40 text-warning ring-1 ring-warning/40",
  PAID: "bg-info/40 text-info ring-1 ring-info/40",
  CONFIRMED: "bg-info/40 text-info ring-1 ring-info/40",
  PROCESSING: "bg-warning/40 text-warning ring-1 ring-warning/40",
  SHIPPED: "bg-muted/40 text-muted-foreground ring-1 ring-border/40",
  DELIVERED: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  CANCELLED: "bg-destructive/40 text-danger ring-1 ring-danger/40",
  REFUNDED: "bg-ink-900 text-muted-foreground",
}

export const ADMIN_ORDER_GROUP_STATUS_LABEL: Record<OrderGroupStatus, string> =
  ORDER_GROUP_STATUS_LABEL

// ── Product Status ──────────────────────────────────────────────────
export const ADMIN_PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = PRODUCT_STATUS_LABEL

export const ADMIN_PRODUCT_STATUS_COLOR: Record<ProductStatus, string> = {
  DRAFT: "bg-ink-900 text-muted-foreground",
  REVIEW: "bg-warning/40 text-warning ring-1 ring-warning/40",
  ACTIVE: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  INACTIVE: "bg-ink-900 text-muted-foreground",
  REJECTED: "bg-destructive/40 text-danger ring-1 ring-danger/40",
}

// ── Seller Status ───────────────────────────────────────────────────
export const ADMIN_SELLER_STATUS_LABEL: Record<SellerStatus, string> = {
  PENDING: "Ausstehend",
  APPROVED: "Genehmigt",
  REJECTED: "Abgelehnt",
  SUSPENDED: "Gesperrt",
}

export const ADMIN_SELLER_STATUS_COLOR: Record<SellerStatus, string> = {
  PENDING: "bg-warning/40 text-warning ring-1 ring-warning/40",
  APPROVED: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  REJECTED: "bg-destructive/40 text-danger ring-1 ring-danger/40",
  SUSPENDED: "bg-ink-900 text-muted-foreground",
}

/** Variant used in AdminSellerDetail with slightly different pending color */
export const ADMIN_SELLER_DETAIL_STATUS_COLOR: Record<SellerStatus, string> = {
  PENDING: "bg-warning/40 text-warning ring-1 ring-warning/40",
  APPROVED: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  REJECTED: "bg-destructive/40 text-danger ring-1 ring-danger/40",
  SUSPENDED: "bg-ink-900 text-muted-foreground ring-1 ring-border/40",
}

// ── Certificate Status ──────────────────────────────────────────────
export const ADMIN_CERTIFICATE_STATUS_LABEL: Record<CertificateStatus, string> =
  CERTIFICATE_STATUS_LABEL

export const ADMIN_CERTIFICATE_STATUS_COLOR: Record<CertificateStatus, string> = {
  PENDING: "bg-warning/40 text-warning ring-1 ring-warning/40",
  VERIFIED: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  REJECTED: "bg-destructive/40 text-danger ring-1 ring-danger/40",
  EXPIRED: "bg-ink-900 text-muted-foreground",
}

// ── Payment Status ──────────────────────────────────────────────────
export const ADMIN_PAYMENT_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-warning/40 text-warning ring-1 ring-warning/40",
  SUCCEEDED: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  FAILED: "bg-destructive/40 text-danger ring-1 ring-danger/40",
  REFUNDED: "bg-ink-900 text-muted-foreground",
}

// ── Settlement Status ───────────────────────────────────────────────
export const ADMIN_SETTLEMENT_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-warning/40 text-warning ring-1 ring-warning/40",
  PROCESSING: "bg-info/40 text-info ring-1 ring-info/40",
  PAID: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  FAILED: "bg-destructive/40 text-danger ring-1 ring-danger/40",
}
