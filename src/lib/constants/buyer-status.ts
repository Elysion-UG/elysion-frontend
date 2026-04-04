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
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-orange-100 text-orange-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-stone-100 text-stone-600",
}

// ── Buyer Order Group Status (light theme) ──────────────────────────
export const BUYER_ORDER_GROUP_STATUS_LABEL: Record<OrderGroupStatus, string> =
  ORDER_GROUP_STATUS_LABEL

export const BUYER_ORDER_GROUP_STATUS_COLOR: Record<OrderGroupStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-orange-100 text-orange-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}
