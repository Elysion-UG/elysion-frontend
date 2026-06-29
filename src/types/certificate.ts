// ── Certificate Types ────────────────────────────────────────────────
export type CertificateStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED"
export type CertificateType = "ORGANIC" | "FAIR_TRADE" | "RECYCLED" | "VEGAN"

export interface Certificate {
  id: string
  sellerId: string
  title: string
  certificateType: CertificateType
  issuerName: string
  issuingBody?: string
  certificateNumber?: string
  /** Issue date — backend may return `validFrom` or `issueDate`; use `issueDate ?? validFrom` */
  issueDate?: string
  validFrom?: string
  /** Expiry date — backend may return `validUntil` or `expiryDate`; use `expiryDate ?? validUntil` */
  expiryDate?: string
  validUntil?: string
  status: CertificateStatus
  rejectionReason?: string
  documentUrl?: string
  notes?: string
  verifiedByAdminId?: string
  verifiedAt?: string
  rejectedByAdminId?: string
  rejectedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CertificateCreateDTO {
  title?: string
  certificateType?: CertificateType
  issuingBody?: string
  issuerName?: string
  certificateNumber?: string
  issueDate?: string
  expiryDate?: string
  documentUrl?: string
  notes?: string
}

export interface CertificateUpdateDTO {
  title?: string
  issuingBody?: string
  certificateNumber?: string
  issueDate?: string
  expiryDate?: string
  documentUrl?: string
}

export interface CertificateAdminActionResponse {
  id: string
  status: CertificateStatus
  updatedAt: string
}

export interface CertificateLinkResponse {
  certificateId: string
  productId: string
  createdAt?: string
}

export interface SellerCertificateCreateDTO {
  certificateType: CertificateType | string
  title: string
  issuerName: string
  certificateNumber?: string
  documentUrl: string
  issueDate?: string
  expiryDate?: string
  notes?: string
}

export interface PublicCertificate {
  id: string
  title?: string
  issuingBody?: string
  issuerName?: string
  issueDate?: string
  validFrom?: string
  expiryDate?: string
  validUntil?: string
  status: CertificateStatus
  certificateType?: CertificateType
}
