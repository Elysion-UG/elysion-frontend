import type { OrderStatus, OrderGroupStatus } from "@/src/types"
import { ORDER_GROUP_STATUS_LABEL } from "./status-labels"

// ── Buyer Order Status (light theme) ────────────────────────────────
export const BUYER_ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
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

export const BUYER_ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-warning-tint text-warning",
  PENDING: "bg-warning-tint text-warning",
  PAID: "bg-info-tint text-info",
  CONFIRMED: "bg-info-tint text-info",
  PROCESSING: "bg-warning-tint text-warning",
  SHIPPED: "bg-secondary text-foreground",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-danger-tint text-danger",
  REFUNDED: "bg-secondary text-foreground",
}

// ── Buyer Order Group Status (light theme) ──────────────────────────
export const BUYER_ORDER_GROUP_STATUS_LABEL: Record<OrderGroupStatus, string> =
  ORDER_GROUP_STATUS_LABEL

export const BUYER_ORDER_GROUP_STATUS_COLOR: Record<OrderGroupStatus, string> = {
  PENDING: "bg-warning-tint text-warning",
  CONFIRMED: "bg-info-tint text-info",
  PROCESSING: "bg-warning-tint text-warning",
  SHIPPED: "bg-secondary text-foreground",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-danger-tint text-danger",
}
