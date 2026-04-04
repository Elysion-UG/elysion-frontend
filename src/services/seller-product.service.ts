import { apiRequest } from "@/src/lib/api-client"
import type { PagedResponse, SellerProductListItem } from "@/src/types"

export interface SellerProductListParams {
  status?: string
  page?: number
  size?: number
}

export const SellerProductService = {
  async list(params: SellerProductListParams = {}): Promise<PagedResponse<SellerProductListItem>> {
    const q = new URLSearchParams()
    if (params.status) q.set("status", params.status)
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    const qs = q.toString()
    return apiRequest(`/api/v1/seller/products${qs ? `?${qs}` : ""}`)
  },
}
