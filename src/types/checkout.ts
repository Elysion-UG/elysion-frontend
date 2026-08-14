// ── Checkout Types ───────────────────────────────────────────────────
export interface CheckoutAddressDTO {
  firstName: string
  lastName: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
}

export interface CheckoutDTO {
  shippingAddressId: string
  billingAddressId?: string
  billingSameAsShipping?: boolean
  billingAddress?: CheckoutAddressDTO
  paymentMethod: "STRIPE" | "INVOICE" | "MOCK"
}

/**
 * Antwort von `POST /api/v1/checkout` (und verschachtelt in der
 * Abschluss-Antwort). Spiegelt `CheckoutStartResponse` aus dem Backend Feld für
 * Feld; alle Felder sind laut Vertrag vorhanden und werden vom Service gegen
 * Zod geprüft, bevor ein Konsument sie sieht (#38).
 *
 * **Kein `tax`, kein `shippingCost`:** der Checkout-Vertrag kennt weder eine
 * Steuer- noch eine Versandkostenposition. Die beiden Felder standen früher hier
 * und wurden in der Bestätigungsseite gerechnet — sie waren zur Laufzeit immer
 * `undefined`.
 */
export interface CheckoutStartResponse {
  cartId: string
  ownershipType: string
  /**
   * Validated line items with nested product/variant summaries. Both summaries are
   * the cart ones (`CartProductSummaryResponse` / `CartVariantSummaryResponse`), so
   * name, image and the human-readable variant options are server-owned here too.
   * `primaryImage` is always `null` on the completion response — the frozen order
   * snapshot carries no image.
   *
   * `id` ist beim Start die Cart-Item-Id, beim Abschluss die Order-Item-Id —
   * die beiden dürfen nicht über die Id korreliert werden.
   */
  items: Array<{
    id: string
    product: { id: string; slug: string; name: string; primaryImage: string | null }
    variant: { id: string; sku: string; options: Array<{ type: string; value: string }> }
    quantity: number
    unitPrice: number
    lineTotal: number
    currency: string
  }>
  shippingAddress: CheckoutAddressDTO
  billingAddress: CheckoutAddressDTO
  subtotal: number
  totalQuantity: number
  currency: string
}

export interface CheckoutCompleteResponse {
  orderId: string
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string
  completedAt: string
  checkout: CheckoutStartResponse
}
