// ── Payment Types ────────────────────────────────────────────────────
export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  currency: string
  status: string
}

export interface CreatePaymentIntentDTO {
  orderId: string
  amount: number
  currency?: string
}

export interface PaymentStatusResponse {
  paymentId: string
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED"
  amount: number
  updatedAt: string
}

// ── File Upload Types ────────────────────────────────────────────────
export type FileCategory = "PRODUCT_IMAGE" | "CERTIFICATE" | "AVATAR" | "DOCUMENT"
export type FileLinkTarget = "PRODUCT" | "CERTIFICATE" | "USER"

export interface FileUploadResponse {
  fileId: string
  url: string
  contentType: string
  sizeBytes: number
}

export interface FileMetadata {
  fileId: string
  url: string
  contentType: string
  sizeBytes: number
  category: FileCategory
  ownerId: string
  createdAt: string
}
