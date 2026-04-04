import { apiRequest } from "@/src/lib/api-client"
import type {
  OrderGroupDetail,
  OrderGroupStatus,
  OrderGroupsPage,
  Settlement,
  ShipOrderDTO,
  ShippingAddress,
} from "@/src/types"
import { type ApiOrderProductSnapshot, normalizeSnapshot } from "./_order-normalizers"

export interface SellerOrderListParams {
  page?: number
  size?: number
  status?: string
}

// ── Raw backend types ─────────────────────────────────────────────────────────
// Backend sends SellerOrderGroupResponse with different field names than
// the frontend OrderGroupDetail type. These interfaces reflect the actual JSON.

interface ApiOrderItem {
  id: string
  quantity: number
  product?: ApiOrderProductSnapshot
  unitPrice?: number
  lineTotal?: number
  currency?: string
  createdAt?: string
  updatedAt?: string
}

interface ApiOrderGroup {
  id: string
  orderId: string
  status: OrderGroupStatus
  items: ApiOrderItem[]
  total: number
  currency?: string
  shipment?: { trackingNumber: string; carrier?: string } | null
  buyer?: { userId?: string; guestEmail?: string | null }
  /** Backend only includes this for CONFIRMED/PROCESSING/SHIPPED orders (DSGVO: purpose limitation). */
  shippingAddress?: ShippingAddress
  createdAt: string
}

// ── Normalizer ────────────────────────────────────────────────────────────────

function normalizeOrderGroup(raw: ApiOrderGroup): OrderGroupDetail {
  return {
    orderGroupId: raw.id,
    orderId: raw.orderId,
    status: raw.status,
    totalAmount: raw.total,
    currency: raw.currency,
    shipment: raw.shipment,
    buyer: raw.buyer,
    shippingAddress: raw.shippingAddress,
    createdAt: raw.createdAt,
    items: (raw.items ?? []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      pricePerUnit: item.unitPrice,
      subtotal: item.lineTotal,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      productSnapshot: item.product ? normalizeSnapshot(item.product) : undefined,
    })),
  }
}

export const SellerOrderService = {
  async list(params: SellerOrderListParams = {}): Promise<OrderGroupsPage> {
    const search = new URLSearchParams()
    if (params.page !== undefined) search.set("page", String(params.page))
    if (params.size !== undefined) search.set("size", String(params.size))
    if (params.status) search.set("status", params.status)
    const qs = search.toString()
    const raw = await apiRequest<{
      items: ApiOrderGroup[]
      page: number
      size: number
      totalItems: number
      totalPages: number
    }>(`/api/v1/seller/orders${qs ? `?${qs}` : ""}`)
    return {
      items: raw.items.map(normalizeOrderGroup),
      page: raw.page,
      size: raw.size,
      totalItems: raw.totalItems,
      totalPages: raw.totalPages,
    }
  },

  async getById(orderGroupId: string): Promise<OrderGroupDetail> {
    const raw = await apiRequest<ApiOrderGroup>(`/api/v1/seller/orders/${orderGroupId}`)
    return normalizeOrderGroup(raw)
  },

  async updateStatus(orderGroupId: string, status: string): Promise<OrderGroupDetail> {
    const raw = await apiRequest<ApiOrderGroup>(`/api/v1/seller/orders/${orderGroupId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    return normalizeOrderGroup(raw)
  },

  async ship(orderGroupId: string, dto: ShipOrderDTO): Promise<OrderGroupDetail> {
    const raw = await apiRequest<ApiOrderGroup>(`/api/v1/seller/orders/${orderGroupId}/ship`, {
      method: "POST",
      body: JSON.stringify(dto),
    })
    return normalizeOrderGroup(raw)
  },

  async deliver(orderGroupId: string): Promise<OrderGroupDetail> {
    const raw = await apiRequest<ApiOrderGroup>(`/api/v1/seller/orders/${orderGroupId}/deliver`, {
      method: "POST",
      body: JSON.stringify({}),
    })
    return normalizeOrderGroup(raw)
  },

  async listSettlements(): Promise<Settlement[]> {
    return apiRequest<Settlement[]>("/api/v1/seller/settlements")
  },
}
