// ── Payment Types ────────────────────────────────────────────────────
export type PaymentProviderCode = "STRIPE" | "PAYPAL" | "KLARNA" | "SOFORT"

export interface PaymentIntent {
  paymentId: string
  orderId: string
  provider: PaymentProviderCode
  amount: number
  currency: string
  status: string
  /** Provider-abhängig; das Backend baut die Antwort auch ohne die beiden Felder. */
  clientSecret: string | null
  providerPaymentId: string | null
}

export interface CreatePaymentIntentDTO {
  orderId: string
  provider: PaymentProviderCode
  paymentMethod?: string
}

export interface PaymentStatusResponse {
  paymentId: string
  orderId: string
  provider: PaymentProviderCode
  amount: number
  currency: string
  /**
   * `domain/order/PaymentStatus` kennt `PENDING`, `SUCCEEDED`, `FAILED`,
   * `REFUNDED` und `PARTIALLY_REFUNDED`. `CANCELLED` steht hier weiterhin,
   * weil die Zahlungsseite darauf verzweigt — geliefert wird es vom aktuellen
   * Backend aber nie.
   */
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "PARTIALLY_REFUNDED" | "REFUNDED"
  receiptUrl?: string
  createdAt: string
  succeededAt?: string
  failedAt?: string
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
