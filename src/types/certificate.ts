// ── Certificate Types ────────────────────────────────────────────────
export type CertificateStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED"
export type CertificateType = "ORGANIC" | "FAIR_TRADE" | "RECYCLED" | "VEGAN"

export interface Certificate {
  id: string
  sellerId: string
  /** Display title shown in UI */
  title: string
  name?: string
  certificateType: CertificateType
  issuerName: string
  issuingBody?: string
  certificateNumber?: string
  validFrom: string
  validUntil?: string
  expiryDate?: string
  status: CertificateStatus
  rejectionReason?: string
  documentUrl?: string
  createdAt: string
  updatedAt: string
}

export interface CertificateCreateDTO {
  title?: string
  name?: string
  certificateType?: CertificateType
  issuingBody?: string
  issuerName?: string
  certificateNumber?: string
  validFrom?: string
  issueDate?: string
  validUntil?: string
  expiryDate?: string
  documentUrl?: string
  notes?: string
}

export interface CertificateUpdateDTO {
  title?: string
  name?: string
  issuingBody?: string
  certificateNumber?: string
  validFrom?: string
  validUntil?: string
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
}

export interface PublicCertificate {
  id: string
  title?: string
  name?: string
  issuingBody?: string
  issuerName?: string
  validFrom?: string
  validUntil?: string
  expiryDate?: string
  status: CertificateStatus
  certificateType?: CertificateType
}
