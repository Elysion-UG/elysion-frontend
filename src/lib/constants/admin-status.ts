import type {
  AccountStatus,
  UserRole,
  OrderStatus,
  ProductStatus,
  SellerStatus,
  CertificateStatus,
} from "@/src/types"

// ── Account Status ──────────────────────────────────────────────────
export const ADMIN_ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  PENDING: "Ausstehend",
  PENDING_VERIFICATION: "Nicht verifiziert",
  ACTIVE: "Aktiv",
  SUSPENDED: "Gesperrt",
  DELETED: "Gelöscht",
}

export const ADMIN_ACCOUNT_STATUS_COLOR: Record<AccountStatus, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  PENDING_VERIFICATION: "bg-yellow-900/40 text-yellow-500 ring-1 ring-yellow-700/40",
  ACTIVE: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  SUSPENDED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  DELETED: "bg-slate-800 text-slate-500",
}

// ── User Role ───────────────────────────────────────────────────────
export const ADMIN_ROLE_COLOR: Record<UserRole, string> = {
  BUYER: "bg-slate-800 text-slate-400",
  SELLER: "bg-cyber-900/50 text-cyber-400 ring-1 ring-cyber-700/40",
  ADMIN: "bg-indigo-900/50 text-indigo-400 ring-1 ring-indigo-700/40",
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
  PENDING_PAYMENT: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  PENDING: "bg-yellow-900/40 text-yellow-500 ring-1 ring-yellow-700/40",
  PAID: "bg-blue-900/40 text-blue-400 ring-1 ring-blue-700/40",
  CONFIRMED: "bg-blue-900/40 text-blue-400 ring-1 ring-blue-700/40",
  PROCESSING: "bg-orange-900/40 text-orange-400 ring-1 ring-orange-700/40",
  SHIPPED: "bg-purple-900/40 text-purple-400 ring-1 ring-purple-700/40",
  DELIVERED: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  CANCELLED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  REFUNDED: "bg-slate-800 text-slate-500",
}

export const ADMIN_ORDER_GROUP_STATUS_LABEL: Record<string, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestätigt",
  PROCESSING: "In Bearbeitung",
  SHIPPED: "Versandt",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
}

// ── Product Status ──────────────────────────────────────────────────
export const ADMIN_PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "Entwurf",
  REVIEW: "In Prüfung",
  ACTIVE: "Aktiv",
  INACTIVE: "Inaktiv",
  REJECTED: "Abgelehnt",
}

export const ADMIN_PRODUCT_STATUS_COLOR: Record<ProductStatus, string> = {
  DRAFT: "bg-slate-800 text-slate-400",
  REVIEW: "bg-amber-900/40 text-amber-400 ring-1 ring-amber-700/40",
  ACTIVE: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  INACTIVE: "bg-slate-800 text-slate-500",
  REJECTED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
}

// ── Seller Status ───────────────────────────────────────────────────
export const ADMIN_SELLER_STATUS_LABEL: Record<SellerStatus, string> = {
  PENDING: "Ausstehend",
  APPROVED: "Genehmigt",
  REJECTED: "Abgelehnt",
  SUSPENDED: "Gesperrt",
}

export const ADMIN_SELLER_STATUS_COLOR: Record<SellerStatus, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  APPROVED: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  REJECTED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  SUSPENDED: "bg-slate-800 text-slate-500",
}

/** Variant used in AdminSellerDetail with slightly different pending color */
export const ADMIN_SELLER_DETAIL_STATUS_COLOR: Record<SellerStatus, string> = {
  PENDING: "bg-amber-900/40 text-amber-400 ring-1 ring-amber-700/40",
  APPROVED: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  REJECTED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  SUSPENDED: "bg-slate-800 text-slate-500 ring-1 ring-slate-700/40",
}

// ── Certificate Status ──────────────────────────────────────────────
export const ADMIN_CERTIFICATE_STATUS_LABEL: Record<CertificateStatus, string> = {
  PENDING: "Ausstehend",
  VERIFIED: "Verifiziert",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
}

export const ADMIN_CERTIFICATE_STATUS_COLOR: Record<CertificateStatus, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  VERIFIED: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  REJECTED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  EXPIRED: "bg-slate-800 text-slate-500",
}

// ── Payment Status ──────────────────────────────────────────────────
export const ADMIN_PAYMENT_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  SUCCEEDED: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  FAILED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  REFUNDED: "bg-slate-800 text-slate-500",
}

// ── Settlement Status ───────────────────────────────────────────────
export const ADMIN_SETTLEMENT_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  PROCESSING: "bg-blue-900/40 text-blue-400 ring-1 ring-blue-700/40",
  PAID: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  FAILED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
}

