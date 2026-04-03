import { apiRequest } from "@/src/lib/api-client"
import type {
  OrderGroupDetail,
  OrderGroupStatus,
  ShipOrderDTO,
  SettlementsPage,
  ShippingAddress,
} from "@/src/types"

export interface SellerOrderListParams {
  page?: number
  size?: number
  status?: string
}

// ── Raw backend types ─────────────────────────────────────────────────────────
// Backend sends SellerOrderGroupResponse with different field names than
// the frontend OrderGroupDetail type. These interfaces reflect the actual JSON.

interface ApiOrderProductSnapshot {
  id?: string
  name?: string
  slug?: string
  seller?: { id?: string }
  variantId?: string
  sku?: string
  options?: Array<{ type: string; value: string }>
  currency?: string
}

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
      productSnapshot: item.product
        ? {
            productId: item.product.id,
            productName: item.product.name,
            productSlug: item.product.slug,
            sellerId: item.product.seller?.id,
            variantId: item.product.variantId,
            sku: item.product.sku,
            options: item.product.options,
            currency: item.product.currency,
          }
        : undefined,
    })),
  }
}

export const SellerOrderService = {
  async list(params: SellerOrderListParams = {}): Promise<OrderGroupDetail[]> {
    const search = new URLSearchParams()
    if (params.page !== undefined) search.set("page", String(params.page))
    if (params.size !== undefined) search.set("size", String(params.size))
    if (params.status) search.set("status", params.status)
    const qs = search.toString()
    const raw = await apiRequest<ApiOrderGroup[]>(`/api/v1/seller/orders${qs ? `?${qs}` : ""}`)
    return raw.map(normalizeOrderGroup)
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

  async listSettlements(params: { page?: number; size?: number } = {}): Promise<SettlementsPage> {
    const search = new URLSearchParams()
    if (params.page !== undefined) search.set("page", String(params.page))
    if (params.size !== undefined) search.set("size", String(params.size))
    const qs = search.toString()
    return apiRequest<SettlementsPage>(`/api/v1/seller/settlements${qs ? `?${qs}` : ""}`)
  },
}
