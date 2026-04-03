/**
 * AdminService — API calls for admin panel operations.
 *
 * All endpoints require ADMIN role.
 *
 * User moderation:
 *   GET   /api/v1/admin/users                         — list users (paginated)
 *   GET   /api/v1/admin/users/{id}                    — get user details
 *   POST  /api/v1/admin/users/{id}/suspend             — suspend user
 *   POST  /api/v1/admin/users/{id}/unsuspend           — reactivate user
 *
 * Seller profile review:
 *   POST  /api/v1/admin/sellers/{id}/approve  — approve seller profile
 *   POST  /api/v1/admin/sellers/{id}/reject   — reject seller profile
 *   POST  /api/v1/admin/sellers/{id}/suspend  — suspend seller profile
 *
 * Certificate verification:
 *   PATCH /api/v1/admin/certificates/{id}/verify      — verify certificate
 *   PATCH /api/v1/admin/certificates/{id}/reject      — reject certificate
 *
 * Note: Certificate verify/reject are also in CertificateService.
 * Use either service — they hit the same endpoint.
 */
import { apiRequest } from "@/src/lib/api-client"
import type {
  AdminUserListItem,
  AdminUserDetails,
  AdminUserListParams,
  AdminOrderListItem,
  AdminOrderDetail,
  AdminProductListItem,
  AdminProductDetail,
  AdminSellerListItem,
  AdminSellerDetail,
  AdminPaymentItem,
  AdminRefundItem,
  AdminPayoutItem,
  Settlement,
  PagedResponse,
  OrderStatus,
  SellerProfile,
} from "@/src/types"

export const AdminService = {
  async listUsers(
    params: Partial<AdminUserListParams> = {}
  ): Promise<PagedResponse<AdminUserListItem>> {
    const query = new URLSearchParams()
    if (params.page !== undefined) query.set("page", String(params.page - 1))
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
    return apiRequest(`/api/v1/admin/users/${id}/suspend`, { method: "POST" })
  },

  async activateUser(id: string): Promise<{ userId: string; status: string }> {
    return apiRequest(`/api/v1/admin/users/${id}/unsuspend`, { method: "POST" })
  },

  async approveSellerProfile(sellerProfileId: string): Promise<SellerProfile> {
    return apiRequest(`/api/v1/admin/sellers/${sellerProfileId}/approve`, {
      method: "POST",
      body: "{}",
    })
  },

  async rejectSellerProfile(sellerProfileId: string, reason: string): Promise<SellerProfile> {
    return apiRequest(`/api/v1/admin/sellers/${sellerProfileId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  },

  async suspendSellerProfile(sellerProfileId: string, reason: string): Promise<SellerProfile> {
    return apiRequest(`/api/v1/admin/sellers/${sellerProfileId}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  },

  async verifyCertificate(certificateId: string): Promise<{
    id: string
    status: string
    verifiedByAdminId: string
    verifiedAt: string
    rejectionReason: null
  }> {
    return apiRequest(`/api/v1/admin/certificates/${certificateId}/verify`, {
      method: "PATCH",
    })
  },

  async rejectCertificate(
    certificateId: string,
    reason: string
  ): Promise<{
    id: string
    status: string
    verifiedByAdminId: null
    verifiedAt: null
    rejectionReason: string
  }> {
    return apiRequest(`/api/v1/admin/certificates/${certificateId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    })
  },

  async getSeller(sellerId: string): Promise<AdminSellerDetail> {
    return apiRequest(`/api/v1/admin/sellers/${sellerId}`)
  },

  async listSellers(
    params: { page?: number; size?: number; status?: string } = {}
  ): Promise<PagedResponse<AdminSellerListItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.status) q.set("status", params.status)
    const qs = q.toString()
    return apiRequest(`/api/v1/admin/sellers${qs ? `?${qs}` : ""}`)
  },

  async getOrder(orderId: string): Promise<AdminOrderDetail> {
    return apiRequest(`/api/v1/admin/orders/${orderId}`)
  },

  async listOrders(
    params: { page?: number; size?: number; status?: OrderStatus } = {}
  ): Promise<PagedResponse<AdminOrderListItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.status) q.set("status", params.status)
    const qs = q.toString()
    return apiRequest(`/api/v1/admin/orders${qs ? `?${qs}` : ""}`)
  },

  async listProducts(
    params: { page?: number; size?: number; search?: string; status?: string } = {}
  ): Promise<PagedResponse<AdminProductListItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.search) q.set("search", params.search)
    const qs = q.toString()
    return apiRequest(`/api/v1/admin/products${qs ? `?${qs}` : ""}`)
  },

  async getProduct(productId: string): Promise<AdminProductDetail> {
    return apiRequest(`/api/v1/admin/products/${productId}`)
  },

  async activateProduct(productId: string): Promise<{ id: string; status: string }> {
    return apiRequest(`/api/v1/admin/products/${productId}/activate`, { method: "POST" })
  },

  async deactivateProduct(productId: string): Promise<{ id: string; status: string }> {
    return apiRequest(`/api/v1/admin/products/${productId}/deactivate`, { method: "POST" })
  },

  async listPayments(
    params: { page?: number; size?: number } = {}
  ): Promise<PagedResponse<AdminPaymentItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    const qs = q.toString()
    return apiRequest(`/api/v1/admin/payments${qs ? `?${qs}` : ""}`)
  },

  async listRefunds(
    params: { page?: number; size?: number } = {}
  ): Promise<PagedResponse<AdminRefundItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    const qs = q.toString()
    return apiRequest(`/api/v1/admin/refunds${qs ? `?${qs}` : ""}`)
  },

  async listSettlements(
    params: { page?: number; size?: number } = {}
  ): Promise<PagedResponse<Settlement>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    const qs = q.toString()
    return apiRequest(`/api/v1/admin/settlements${qs ? `?${qs}` : ""}`)
  },

  async listPayouts(
    params: { page?: number; size?: number } = {}
  ): Promise<PagedResponse<AdminPayoutItem>> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    const qs = q.toString()
    return apiRequest(`/api/v1/admin/payouts${qs ? `?${qs}` : ""}`)
  },

  async cleanupRefreshTokens(): Promise<{ deletedCount: number }> {
    return apiRequest(`/api/v1/admin/maintenance/cleanup-refresh-tokens`, { method: "POST" })
  },

  async expirePendingOrders(): Promise<{ expiredCount: number }> {
    return apiRequest(`/api/v1/admin/maintenance/expire-pending-orders`, { method: "POST" })
  },
}
