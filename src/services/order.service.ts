import { apiRequest, buildQuery } from "@/src/lib/api-client"
import { errorStore } from "@/src/lib/error-store"
import { normalizePage } from "@/src/lib/normalize-page"
import { orderGroupStatusSchema, orderStatusSchema } from "@/src/lib/api-schemas"
import type { Order, OrderDetail, OrderGroup, OrderItem } from "@/src/types"
import { type ApiOrderProductSnapshot, normalizeSnapshot } from "./_order-normalizers"

// Safely narrow a backend status string to one of our known enum values.
// Unknown values from the server fall back to a sane default and are reported
// to the error store so contract drift is visible without using console.* in
// production. This is preferable to `as` casts that silently render an
// undefined status badge.
function parseOrderStatus(raw: string | undefined): OrderDetail["status"] {
  if (!raw) return undefined
  const result = orderStatusSchema.safeParse(raw)
  if (result.success) return result.data
  errorStore.report({
    severity: "low",
    category: "api",
    message: `[order.service] unknown order status from backend: ${raw}`,
  })
  return "PENDING"
}

function parseOrderGroupStatus(raw: string): OrderGroup["status"] {
  const result = orderGroupStatusSchema.safeParse(raw)
  if (result.success) return result.data
  errorStore.report({
    severity: "low",
    category: "api",
    message: `[order.service] unknown order-group status from backend: ${raw}`,
  })
  return "PENDING"
}

export interface OrderListParams {
  page?: number
  size?: number
  status?: string
}

// ── Raw backend shapes ────────────────────────────────────────────────

interface ApiOrderItem {
  id: string
  variantId?: string
  quantity: number
  unitPrice?: number
  lineTotal?: number
  /** Some API versions already use normalised names */
  pricePerUnit?: number
  subtotal?: number
  product?: ApiOrderProductSnapshot
  productSnapshot?: ApiOrderProductSnapshot
}

interface ApiOrderGroup {
  id: string
  seller?: { id?: string } | null
  sellerId?: string
  status: string
  subtotal?: number
  shipping?: number
  shippingCost?: number
  shipment?: { trackingNumber: string; carrier?: string } | null
  items?: ApiOrderItem[]
}

interface ApiOrderDetail {
  id?: string
  orderNumber?: string
  status?: string
  createdAt?: string
  shippingAddress?: {
    firstName: string
    lastName: string
    street: string
    houseNumber: string
    postalCode: string
    city: string
    country: string
  }
  groups?: ApiOrderGroup[]
  subtotal?: number
  shippingCost?: number
  shipping?: number
  tax?: number | null
  total?: number
  currency?: string
}

// ── Normalisation helpers ─────────────────────────────────────────────

function normalizeItem(raw: ApiOrderItem): OrderItem {
  const rawSnap = raw.product ?? raw.productSnapshot
  return {
    id: raw.id,
    variantId: raw.variantId,
    quantity: raw.quantity,
    pricePerUnit: raw.pricePerUnit ?? raw.unitPrice ?? 0,
    subtotal: raw.subtotal ?? raw.lineTotal ?? 0,
    productSnapshot: rawSnap ? normalizeSnapshot(rawSnap) : undefined,
  }
}

function normalizeGroup(raw: ApiOrderGroup): OrderGroup {
  return {
    id: raw.id,
    sellerId: raw.sellerId ?? raw.seller?.id,
    status: parseOrderGroupStatus(raw.status),
    subtotal: raw.subtotal,
    shippingCost: raw.shippingCost ?? raw.shipping,
    shipment: raw.shipment,
    items: (raw.items ?? []).map(normalizeItem),
  }
}

function normalizeOrderDetail(raw: ApiOrderDetail): OrderDetail {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    status: parseOrderStatus(raw.status),
    createdAt: raw.createdAt,
    shippingAddress: raw.shippingAddress,
    groups: (raw.groups ?? []).map(normalizeGroup),
    subtotal: raw.subtotal,
    shippingCost: raw.shippingCost ?? raw.shipping,
    tax: raw.tax,
    total: raw.total,
    currency: raw.currency,
  }
}

// ── Service ───────────────────────────────────────────────────────────

export const OrderService = {
  async list(params: OrderListParams = {}): Promise<Order[]> {
    // Backend returns a paginated envelope { items, page, totalElements, totalPages }
    const res = await apiRequest<{ items?: Order[] } | Order[]>(
      `/api/v1/orders${buildQuery({ page: params.page, size: params.size, status: params.status })}`
    )
    return normalizePage<Order, Order>(res).items
  },

  async getById(id: string): Promise<OrderDetail> {
    const raw = await apiRequest<ApiOrderDetail>(`/api/v1/orders/${id}`)
    return normalizeOrderDetail(raw)
  },
}
