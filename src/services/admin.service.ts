import { apiRequest } from "@/src/lib/api-client"
import type {
  AdminUserListItem,
  AdminUserDetails,
  AdminUserListParams,
  PagedResponse,
  SellerProfile,
  AdminSellerListItem,
  AdminSellerDetails,
  AdminSellerListParams,
  AdminProductListItem,
  AdminProductDetails,
  AdminProductListParams,
  AdminOrderListItem,
  AdminOrderListParams,
  OrderDetail,
  AdminPaymentItem,
  AdminRefundItem,
  Settlement,
  AdminPayoutItem,
  AdminFinanceListParams,
} from "@/src/types"

export const AdminService = {
  async listUsers(
    params: Partial<AdminUserListParams> = {}
  ): Promise<PagedResponse<AdminUserListItem>> {
    const query = new URLSearchParams()
    if (params.page !== undefined) query.set("page", String(params.page))
    if (params.pageSize !== undefined) query.set("size", String(params.pageSize))
    if (params.search) query.set("search", params.search)
    if (params.role) query.set("role", params.role)
    if (params.status) query.set("status", params.status)
    const qs = query.toString()
    return apiRequest(`/api/v1/admin/users${qs ? `?${qs}` : ""}`)
  },

  async getUser(id: string): Promise<AdminUserDetails> {
    return apiRequest(`/api/v1/admin/users/${id}`)
  },

  async suspendUser(id: string): Promise<{ userId: string; status: string }> {
    return apiRequest(`/api/v1/admin/users/${id}/suspend`, {
      method: "PATCH",
      body: "{}",
    })
  },

  async activateUser(id: string): Promise<{ userId: string; status: string }> {
    return apiRequest(`/api/v1/admin/users/${id}/activate`, {
      method: "PATCH",
      body: "{}",
    })
  },

  async approveSellerProfile(sellerProfileId: string): Promise<SellerProfile> {
    return apiRequest(`/api/v1/admin/seller-profiles/${sellerProfileId}/approve`, {
      method: "POST",
      body: "{}",
    })
  },

  async rejectSellerProfile(
    sellerProfileId: string,
    reason: string
  ): Promise<SellerProfile> {
    return apiRequest(`/api/v1/admin/seller-profiles/${sellerProfileId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  },

  async suspendSellerProfile(
    sellerProfileId: string,
    reason: string
  ): Promise<SellerProfile> {
    return apiRequest(`/api/v1/admin/seller-profiles/${sellerProfileId}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  },

  async verifyCertificate(
    certificateId: string
  ): Promise<{ id: string; status: string; verifiedByAdminId: string; verifiedAt: string; rejectionReason: null }> {
    return apiRequest(`/api/v1/admin/certificates/${certificateId}/verify`, {
      method: "PATCH",
    })
  },

  async rejectCertificate(
    certificateId: string,
    reason: string
  ): Promise<{ id: string; status: string; verifiedByAdminId: null; verifiedAt: null; rejectionReason: string }> {
    return apiRequest(`/api/v1/admin/certificates/${certificateId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    })
  },

  // ── Sellers ──────────────────────────────────────────────────────

  async listSellers(params: AdminSellerListParams = {}): Promise<PagedResponse<AdminSellerListItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.status) q.set("status", params.status)
    const qs = q.toString()
    return apiRequest(`/api/v1/admin/sellers${qs ? `?${qs}` : ""}`)
  },

  async getSeller(id: string): Promise<AdminSellerDetails> {
    return apiRequest(`/api/v1/admin/sellers/${id}`)
  },

  async unsuspendUser(id: string): Promise<{ userId: string; status: string }> {
    return apiRequest(`/api/v1/admin/users/${id}/unsuspend`, { method: "POST", body: "{}" })
  },

  // ── Products ─────────────────────────────────────────────────────

  async listProducts(params: AdminProductListParams = {}): Promise<PagedResponse<AdminProductListItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.status) q.set("status", params.status)
    const qs = q.toString()
    return apiRequest(`/api/v1/admin/products${qs ? `?${qs}` : ""}`)
  },

  async getProduct(id: string): Promise<AdminProductDetails> {
    return apiRequest(`/api/v1/admin/products/${id}`)
  },

  async activateProduct(id: string): Promise<unknown> {
    return apiRequest(`/api/v1/admin/products/${id}/activate`, { method: "POST", body: "{}" })
  },

  async deactivateProduct(id: string): Promise<unknown> {
    return apiRequest(`/api/v1/admin/products/${id}/deactivate`, { method: "POST", body: "{}" })
  },

  // ── Orders ───────────────────────────────────────────────────────

  async listOrders(params: AdminOrderListParams = {}): Promise<PagedResponse<AdminOrderListItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.status) q.set("status", params.status)
    const qs = q.toString()
    return apiRequest(`/api/v1/admin/orders${qs ? `?${qs}` : ""}`)
  },

  async getOrder(id: string): Promise<OrderDetail> {
    return apiRequest(`/api/v1/admin/orders/${id}`)
  },

  // ── Finance ──────────────────────────────────────────────────────

  async listPayments(params: AdminFinanceListParams = {}): Promise<PagedResponse<AdminPaymentItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    return apiRequest(`/api/v1/admin/payments${q.toString() ? `?${q}` : ""}`)
  },

  async listRefunds(params: AdminFinanceListParams = {}): Promise<PagedResponse<AdminRefundItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    return apiRequest(`/api/v1/admin/refunds${q.toString() ? `?${q}` : ""}`)
  },

  async listSettlements(params: AdminFinanceListParams = {}): Promise<PagedResponse<Settlement>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    return apiRequest(`/api/v1/admin/settlements${q.toString() ? `?${q}` : ""}`)
  },

  async listPayouts(params: AdminFinanceListParams = {}): Promise<PagedResponse<AdminPayoutItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    return apiRequest(`/api/v1/admin/payouts${q.toString() ? `?${q}` : ""}`)
  },

  async getDashboard(): Promise<unknown> {
    return apiRequest(`/api/v1/admin/dashboard`)
  },

  // ── Maintenance ──────────────────────────────────────────────────

  async cleanupRefreshTokens(): Promise<unknown> {
    return apiRequest(`/api/v1/admin/maintenance/refresh-tokens/cleanup`, { method: "POST", body: "{}" })
  },

  async expirePendingOrders(): Promise<unknown> {
    return apiRequest(`/api/v1/admin/maintenance/pending-orders/expire`, { method: "POST", body: "{}" })
  },
}
