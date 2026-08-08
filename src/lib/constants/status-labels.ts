import type {
  ProductStatus,
  OrderGroupStatus,
  CertificateStatus,
  ShippingSlaStatus,
} from "@/src/types"

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

/** Read-only Versandfrist-Zustände der Seller-Order-Reads (#143). */
export const SHIPPING_SLA_STATUS_LABEL: Record<ShippingSlaStatus, string> = {
  NOT_APPLICABLE: "Keine Versandfrist",
  PENDING: "Versandfrist läuft",
  BREACHED: "Versand überfällig",
  MET: "Rechtzeitig versandt",
  MISSED: "Verspätet versandt",
}

export const CERTIFICATE_STATUS_LABEL: Record<CertificateStatus, string> = {
  PENDING: "Ausstehend",
  VERIFIED: "Verifiziert",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
}
