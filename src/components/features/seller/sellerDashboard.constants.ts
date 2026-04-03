import type {
  CertificateStatus,
  CertificateType,
  ProductStatus,
  OrderGroupStatus,
} from "@/src/types"

export type Tab = "products" | "orders" | "settlements" | "certificates" | "profile"

export const certStatusLabel: Record<CertificateStatus, string> = {
  PENDING: "Ausstehend",
  VERIFIED: "Verifiziert",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
}

export const certStatusColor: Record<CertificateStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-500",
}

export const CERT_TYPES: CertificateType[] = ["ORGANIC", "FAIR_TRADE", "RECYCLED", "VEGAN"]

export const productStatusLabel: Record<ProductStatus, string> = {
  DRAFT: "Entwurf",
  REVIEW: "Wird geprüft",
  ACTIVE: "Aktiv",
  INACTIVE: "Inaktiv",
  REJECTED: "Abgelehnt",
}

export const productStatusColor: Record<ProductStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  REVIEW: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  REJECTED: "bg-red-100 text-red-700",
}

export const orderStatusLabel: Record<OrderGroupStatus, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestätigt",
  PROCESSING: "In Bearbeitung",
  SHIPPED: "Versandt",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
}

export const orderStatusColor: Record<OrderGroupStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-orange-100 text-orange-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}
