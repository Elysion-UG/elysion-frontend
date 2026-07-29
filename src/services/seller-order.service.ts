import { z } from "zod"
import { apiRequest, buildQuery } from "@/src/lib/api-client"
import { parseApiResponse, orderGroupStatusSchema } from "@/src/lib/api-schemas"
import { normalizePage } from "@/src/lib/normalize-page"
import type { OrderGroupDetail, Page, Settlement, ShipOrderDTO } from "@/src/types"
import { apiOrderProductSnapshotSchema, normalizeSnapshot } from "./_order-normalizers"

export interface SellerOrderListParams {
  page?: number
  size?: number
  status?: string
}

// ── Raw backend schemas ───────────────────────────────────────────────────────
// Backend sends SellerOrderGroupResponse with different field names than the
// frontend OrderGroupDetail type. These Zod schemas mirror the actual JSON and
// are validated at the boundary (parseApiResponse) so contract drift — a renamed
// field or an unknown order-group status on the money path — fails loud instead
// of casting through silently (#38).

const apiShippingAddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  street: z.string(),
  houseNumber: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
})

const apiOrderItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  product: apiOrderProductSnapshotSchema.optional(),
  unitPrice: z.number().optional(),
  lineTotal: z.number().optional(),
  currency: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

const apiOrderGroupSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  status: orderGroupStatusSchema,
  items: z.array(apiOrderItemSchema),
  total: z.number(),
  currency: z.string().optional(),
  shipment: z.object({ trackingNumber: z.string(), carrier: z.string().optional() }).nullish(),
  buyer: z.object({ userId: z.string().optional(), guestEmail: z.string().nullish() }).optional(),
  /** Backend only includes this for CONFIRMED/PROCESSING/SHIPPED orders (DSGVO: purpose limitation). */
  shippingAddress: apiShippingAddressSchema.optional(),
  createdAt: z.string(),
})

const apiOrderGroupPageSchema = z.object({
  items: z.array(apiOrderGroupSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
})

type ApiOrderGroup = z.infer<typeof apiOrderGroupSchema>

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
  async list(params: SellerOrderListParams = {}): Promise<Page<OrderGroupDetail>> {
    const raw = await apiRequest<unknown>(
      `/api/v1/seller/orders${buildQuery({ page: params.page, size: params.size, status: params.status })}`
    )
    const page = parseApiResponse(apiOrderGroupPageSchema, raw, "seller-order.list")
    return normalizePage(page, normalizeOrderGroup)
  },

  async getById(orderGroupId: string): Promise<OrderGroupDetail> {
    const raw = await apiRequest<unknown>(`/api/v1/seller/orders/${orderGroupId}`)
    return normalizeOrderGroup(parseApiResponse(apiOrderGroupSchema, raw, "seller-order.getById"))
  },

  async updateStatus(orderGroupId: string, status: string): Promise<OrderGroupDetail> {
    const raw = await apiRequest<unknown>(`/api/v1/seller/orders/${orderGroupId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    return normalizeOrderGroup(
      parseApiResponse(apiOrderGroupSchema, raw, "seller-order.updateStatus")
    )
  },

  async ship(orderGroupId: string, dto: ShipOrderDTO): Promise<OrderGroupDetail> {
    const raw = await apiRequest<unknown>(`/api/v1/seller/orders/${orderGroupId}/ship`, {
      method: "POST",
      body: JSON.stringify(dto),
    })
    return normalizeOrderGroup(parseApiResponse(apiOrderGroupSchema, raw, "seller-order.ship"))
  },

  async deliver(orderGroupId: string): Promise<OrderGroupDetail> {
    const raw = await apiRequest<unknown>(`/api/v1/seller/orders/${orderGroupId}/deliver`, {
      method: "POST",
      body: JSON.stringify({}),
    })
    return normalizeOrderGroup(parseApiResponse(apiOrderGroupSchema, raw, "seller-order.deliver"))
  },

  async listSettlements(): Promise<Settlement[]> {
    return apiRequest<Settlement[]>("/api/v1/seller/settlements")
  },
}
