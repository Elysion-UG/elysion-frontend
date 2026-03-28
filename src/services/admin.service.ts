/**
 * AdminService — API calls for admin panel operations.
 *
 * All endpoints require ADMIN role.
 *
 * User moderation:
 *   GET   /api/v1/admin/users                         — list users (paginated)
 *   GET   /api/v1/admin/users/{id}                    — get user details
 *   PATCH /api/v1/admin/users/{id}/suspend             — suspend user
 *   PATCH /api/v1/admin/users/{id}/activate            — reactivate user
 *
 * Seller profile review:
 *   POST  /api/v1/admin/seller-profiles/{id}/approve  — approve seller profile
 *   POST  /api/v1/admin/seller-profiles/{id}/reject   — reject seller profile
 *   POST  /api/v1/admin/seller-profiles/{id}/suspend  — suspend seller profile
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
  PagedResponse,
  SellerProfile,
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
}
