/**
 * CertificateService — API calls for sustainability certificates.
 *
 * Seller flow:
 *   POST  /api/v1/certificates             — create certificate
 *   GET   /api/v1/certificates             — list own certificates
 *   GET   /api/v1/certificates/{id}        — get certificate detail
 *   PATCH /api/v1/certificates/{id}        — update certificate (only PENDING state)
 *
 * Link management (Seller/Admin):
 *   POST   /api/v1/certificates/{certId}/products/{productId}  — link to product
 *   DELETE /api/v1/certificates/{certId}/products/{productId}  — unlink from product
 *
 * Admin:
 *   PATCH /api/v1/admin/certificates/{id}/verify  — verify certificate
 *   PATCH /api/v1/admin/certificates/{id}/reject  — reject certificate
 *
 * Public:
 *   GET /api/v1/products/{productId}/certificates — public certificates for a product
 */
import { apiRequest } from "@/src/lib/api-client"
import type {
  Certificate,
  CertificateCreateDTO,
  CertificateUpdateDTO,
  CertificateAdminActionResponse,
  CertificateLinkResponse,
  PublicCertificate,
} from "@/src/types"

export const CertificateService = {
  async create(dto: CertificateCreateDTO): Promise<Certificate> {
    return apiRequest("/api/v1/certificates", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async list(): Promise<Certificate[]> {
    return apiRequest("/api/v1/certificates")
  },

  async getById(id: string): Promise<Certificate> {
    return apiRequest(`/api/v1/certificates/${id}`)
  },

  async update(id: string, dto: CertificateUpdateDTO): Promise<Certificate> {
    return apiRequest(`/api/v1/certificates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async linkToProduct(certificateId: string, productId: string): Promise<CertificateLinkResponse> {
    return apiRequest(`/api/v1/certificates/${certificateId}/products/${productId}`, {
      method: "POST",
    })
  },

  async unlinkFromProduct(certificateId: string, productId: string): Promise<null> {
    return apiRequest(`/api/v1/certificates/${certificateId}/products/${productId}`, {
      method: "DELETE",
    })
  },

  async verify(certificateId: string): Promise<CertificateAdminActionResponse> {
    return apiRequest(`/api/v1/admin/certificates/${certificateId}/verify`, {
      method: "PATCH",
    })
  },

  async reject(certificateId: string, reason: string): Promise<CertificateAdminActionResponse> {
    return apiRequest(`/api/v1/admin/certificates/${certificateId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    })
  },

  async getProductCertificates(productId: string): Promise<PublicCertificate[]> {
    return apiRequest(`/api/v1/products/${productId}/certificates`)
  },

  /** Admin: list all certificates across all sellers (same endpoint, admins see all) */
  async listAll(): Promise<Certificate[]> {
    return apiRequest(`/api/v1/certificates`)
  },
}
