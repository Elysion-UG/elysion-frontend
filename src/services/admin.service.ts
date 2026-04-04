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
 *
 * Dashboard:
 *   GET   /api/v1/admin/dashboard                       — operational overview stats
 */
import { apiRequest, buildQuery } from "@/src/lib/api-client"
import type {
  AdminDashboardData,
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
  async getDashboard(): Promise<AdminDashboardData> {
    return apiRequest("/api/v1/admin/dashboard")
  },

  async listUsers(
    params: Partial<AdminUserListParams> = {}
  ): Promise<PagedResponse<AdminUserListItem>> {
    return apiRequest(
      `/api/v1/admin/users${buildQuery({
        page: params.page !== undefined ? params.page - 1 : undefined,
        size: params.pageSize,
        search: params.search,
        role: params.role,
        status: params.status,
      })}`
    )
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
    return apiRequest(
      `/api/v1/admin/sellers${buildQuery({ page: params.page, size: params.size, status: params.status })}`
    )
  },

  async getOrder(orderId: string): Promise<AdminOrderDetail> {
    return apiRequest(`/api/v1/admin/orders/${orderId}`)
  },

  async listOrders(
    params: { page?: number; size?: number; status?: OrderStatus } = {}
  ): Promise<PagedResponse<AdminOrderListItem>> {
    return apiRequest(
      `/api/v1/admin/orders${buildQuery({ page: params.page, size: params.size, status: params.status })}`
    )
  },

  async listProducts(
    params: { page?: number; size?: number; search?: string; status?: string } = {}
  ): Promise<PagedResponse<AdminProductListItem>> {
    return apiRequest(
      `/api/v1/admin/products${buildQuery({ page: params.page, size: params.size, search: params.search, status: params.status })}`
    )
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
    return apiRequest(
      `/api/v1/admin/payments${buildQuery({ page: params.page, size: params.size })}`
    )
  },

  async listRefunds(
    params: { page?: number; size?: number } = {}
  ): Promise<PagedResponse<AdminRefundItem>> {
    return apiRequest(
      `/api/v1/admin/refunds${buildQuery({ page: params.page, size: params.size })}`
    )
  },

  async listSettlements(
    params: { page?: number; size?: number } = {}
  ): Promise<PagedResponse<Settlement>> {
    return apiRequest(
      `/api/v1/admin/settlements${buildQuery({ page: params.page, size: params.size })}`
    )
  },

  async listPayouts(
    params: { page?: number; size?: number } = {}
  ): Promise<PagedResponse<AdminPayoutItem>> {
    return apiRequest(
      `/api/v1/admin/payouts${buildQuery({ page: params.page, size: params.size })}`
    )
  },

  async cleanupRefreshTokens(): Promise<{ deletedCount: number }> {
    return apiRequest(`/api/v1/admin/maintenance/cleanup-refresh-tokens`, { method: "POST" })
  },

  async expirePendingOrders(): Promise<{ expiredCount: number }> {
    return apiRequest(`/api/v1/admin/maintenance/expire-pending-orders`, { method: "POST" })
  },
}
