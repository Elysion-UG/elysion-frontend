import { apiRequest } from "@/src/lib/api-client"
import type { OrderGroupDetail, ShipOrderDTO, SettlementsPage } from "@/src/types"

export interface SellerOrderListParams {
  page?: number
  size?: number
  status?: string
}

export const SellerOrderService = {
  async list(params: SellerOrderListParams = {}): Promise<OrderGroupDetail[]> {
    const search = new URLSearchParams()
    if (params.page !== undefined) search.set("page", String(params.page))
    if (params.size !== undefined) search.set("size", String(params.size))
    if (params.status) search.set("status", params.status)
    const qs = search.toString()
    return apiRequest<OrderGroupDetail[]>(`/api/v1/seller/orders${qs ? `?${qs}` : ""}`)
  },

  async getById(orderGroupId: string): Promise<OrderGroupDetail> {
    return apiRequest<OrderGroupDetail>(`/api/v1/seller/orders/${orderGroupId}`)
  },

  async updateStatus(orderGroupId: string, status: string): Promise<OrderGroupDetail> {
    return apiRequest<OrderGroupDetail>(`/api/v1/seller/orders/${orderGroupId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  },

  async ship(orderGroupId: string, dto: ShipOrderDTO): Promise<OrderGroupDetail> {
    return apiRequest<OrderGroupDetail>(`/api/v1/seller/orders/${orderGroupId}/ship`, {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async deliver(orderGroupId: string): Promise<OrderGroupDetail> {
    return apiRequest<OrderGroupDetail>(`/api/v1/seller/orders/${orderGroupId}/deliver`, {
      method: "POST",
      body: JSON.stringify({}),
    })
  },

  async listSettlements(params: { page?: number; size?: number } = {}): Promise<SettlementsPage> {
    const search = new URLSearchParams()
    if (params.page !== undefined) search.set("page", String(params.page))
    if (params.size !== undefined) search.set("size", String(params.size))
    const qs = search.toString()
    return apiRequest<SettlementsPage>(`/api/v1/seller/settlements${qs ? `?${qs}` : ""}`)
  },
}
