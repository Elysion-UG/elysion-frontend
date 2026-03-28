import { apiRequest } from "@/src/lib/api-client"
import type { Order, OrderDetail } from "@/src/types"

export interface OrderListParams {
  page?: number
  size?: number
  status?: string
}

export const OrderService = {
  async list(params: OrderListParams = {}): Promise<Order[]> {
    const search = new URLSearchParams()
    if (params.page !== undefined) search.set("page", String(params.page))
    if (params.size !== undefined) search.set("size", String(params.size))
    if (params.status) search.set("status", params.status)
    const qs = search.toString()
    return apiRequest<Order[]>(`/api/v1/orders${qs ? `?${qs}` : ""}`)
  },

  async getById(id: string): Promise<OrderDetail> {
    return apiRequest<OrderDetail>(`/api/v1/orders/${id}`)
  },
}
