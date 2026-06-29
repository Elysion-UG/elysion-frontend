import type { ProductStatus, OrderGroupStatus, CertificateStatus } from "@/src/types"

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "Entwurf",
  REVIEW: "In Prüfung",
  ACTIVE: "Aktiv",
  INACTIVE: "Inaktiv",
  REJECTED: "Abgelehnt",
}

export const ORDER_GROUP_STATUS_LABEL: Record<OrderGroupStatus, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestätigt",
  PROCESSING: "In Bearbeitung",
  SHIPPED: "Versandt",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
}

export const CERTIFICATE_STATUS_LABEL: Record<CertificateStatus, string> = {
  PENDING: "Ausstehend",
  VERIFIED: "Verifiziert",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
}
