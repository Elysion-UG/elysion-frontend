/**
 * AdminService — API calls for admin panel operations.
 *
 * Every endpoint here requires the ADMIN role. Endpoint catalogue:
 * docs/api-integration.md.
 *
 * Certificate verify/reject also exist on CertificateService — same endpoint,
 * either service works.
 */
import { apiRequest, buildQuery } from "@/src/lib/api-client"
import { parseApiResponse } from "@/src/lib/api-schemas"
import { apiRefundResultSchema, buildRefundBody, normalizeRefundResult } from "./_refund-schemas"
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
  PayoutDueItem,
  RefundRequestDTO,
  RefundResult,
  Settlement,
  Page,
  OrderStatus,
  SellerProfile,
} from "@/src/types"

export const AdminService = {
  async getDashboard(): Promise<AdminDashboardData> {
    return apiRequest("/api/v1/admin/dashboard")
  },

  async listUsers(params: Partial<AdminUserListParams> = {}): Promise<Page<AdminUserListItem>> {
    return apiRequest(
      `/api/v1/admin/users${buildQuery({
        // 0-based page index, consistent with every other list endpoint (#36).
        page: params.page,
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

  /**
   * Setzt die Plattformgebühr (Provision) eines Sellers in Prozent.
   * @param commissionRate Prozentsatz 0–100 (z. B. 15 für 15 %)
   */
  async updateSellerCommission(
    sellerId: string,
    commissionRate: number
  ): Promise<AdminSellerDetail> {
    return apiRequest(`/api/v1/admin/sellers/${sellerId}/commission`, {
      method: "PATCH",
      body: JSON.stringify({ commissionRate }),
    })
  },

  async listSellers(
    params: { page?: number; size?: number; status?: string } = {}
  ): Promise<Page<AdminSellerListItem>> {
    return apiRequest(
      `/api/v1/admin/sellers${buildQuery({ page: params.page, size: params.size, status: params.status })}`
    )
  },

  async getOrder(orderId: string): Promise<AdminOrderDetail> {
    return apiRequest(`/api/v1/admin/orders/${orderId}`)
  },

  async listOrders(
    params: { page?: number; size?: number; status?: OrderStatus } = {}
  ): Promise<Page<AdminOrderListItem>> {
    return apiRequest(
      `/api/v1/admin/orders${buildQuery({ page: params.page, size: params.size, status: params.status })}`
    )
  },

  async listProducts(
    params: { page?: number; size?: number; search?: string; status?: string } = {}
  ): Promise<Page<AdminProductListItem>> {
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
  ): Promise<Page<AdminPaymentItem>> {
    return apiRequest(
      `/api/v1/admin/payments${buildQuery({ page: params.page, size: params.size })}`
    )
  },

  async listRefunds(params: { page?: number; size?: number } = {}): Promise<Page<AdminRefundItem>> {
    return apiRequest(
      `/api/v1/admin/refunds${buildQuery({ page: params.page, size: params.size })}`
    )
  },

  /**
   * Erstattung als **Eskalation** — gleicher Pfad wie die Leseliste, andere
   * Methode. Ohne Ownership-Schranke: greift, wenn der Seller nicht reagiert,
   * bei Disputes und Betrug (Management-Decision §1.4). `amount` weglassen
   * erstattet den kompletten Restbetrag der OrderGroup.
   */
  async createRefund(dto: RefundRequestDTO): Promise<RefundResult> {
    const raw = await apiRequest<unknown>("/api/v1/admin/refunds", {
      method: "POST",
      body: buildRefundBody(dto),
    })
    return normalizeRefundResult(parseApiResponse(apiRefundResultSchema, raw, "admin.createRefund"))
  },

  async listSettlements(params: { page?: number; size?: number } = {}): Promise<Page<Settlement>> {
    return apiRequest(
      `/api/v1/admin/settlements${buildQuery({ page: params.page, size: params.size })}`
    )
  },

  async listPayouts(params: { page?: number; size?: number } = {}): Promise<Page<AdminPayoutItem>> {
    return apiRequest(
      `/api/v1/admin/payouts${buildQuery({ page: params.page, size: params.size })}`
    )
  },

  /**
   * Listet pro Seller die fälligen (auszahlungsfähigen) Settlements,
   * aggregiert für die monatliche manuelle Freigabe.
   */
  async listDuePayouts(): Promise<PayoutDueItem[]> {
    return apiRequest(`/api/v1/admin/payouts/due`)
  },

  /**
   * Gibt die fälligen Settlements eines Sellers frei und löst die
   * Stripe-Auszahlung (Transfer/Payout) aus. Setzt ein aktives
   * Connect-Express-Konto des Sellers voraus.
   */
  async runPayout(sellerId: string): Promise<AdminPayoutItem> {
    return apiRequest(`/api/v1/admin/payouts/run`, {
      method: "POST",
      body: JSON.stringify({ sellerId }),
    })
  },

  async cleanupRefreshTokens(): Promise<{ deletedCount: number }> {
    return apiRequest(`/api/v1/admin/maintenance/cleanup-refresh-tokens`, { method: "POST" })
  },

  async expirePendingOrders(): Promise<{ expiredCount: number }> {
    return apiRequest(`/api/v1/admin/maintenance/expire-pending-orders`, { method: "POST" })
  },
}
