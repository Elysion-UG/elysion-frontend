import { apiRequest } from "@/src/lib/api-client"
import type { Order, OrderDetail, OrderGroup, OrderItem, OrderProductSnapshot } from "@/src/types"

export interface OrderListParams {
  page?: number
  size?: number
  status?: string
}

// ── Raw backend shapes ────────────────────────────────────────────────

interface ApiOrderProductSnapshot {
  id?: string
  name?: string
  slug?: string
  seller?: { id?: string } | null
  variantId?: string
  sku?: string
  options?: Array<{ type: string; value: string }>
  currency?: string
}

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

function normalizeSnapshot(raw: ApiOrderProductSnapshot | undefined | null): OrderProductSnapshot {
  return {
    productId: raw?.id,
    productName: raw?.name,
    productSlug: raw?.slug,
    sellerId: raw?.seller?.id,
    variantId: raw?.variantId,
    sku: raw?.sku,
    options: raw?.options,
    currency: raw?.currency,
  }
}

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
    status: raw.status as OrderGroup["status"],
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
    status: raw.status as OrderDetail["status"],
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
    const search = new URLSearchParams()
    if (params.page !== undefined) search.set("page", String(params.page))
    if (params.size !== undefined) search.set("size", String(params.size))
    if (params.status) search.set("status", params.status)
    const qs = search.toString()
    // Backend returns a paginated envelope { items, page, totalElements, totalPages }
    const res = await apiRequest<{ items?: Order[] } | Order[]>(
      `/api/v1/orders${qs ? `?${qs}` : ""}`
    )
    return Array.isArray(res) ? res : ((res as { items?: Order[] }).items ?? [])
  },

  async getById(id: string): Promise<OrderDetail> {
    const raw = await apiRequest<ApiOrderDetail>(`/api/v1/orders/${id}`)
    return normalizeOrderDetail(raw)
  },
}
