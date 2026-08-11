/**
 * CheckoutService — Checkout-Start und -Abschluss.
 *
 * Endpunkte (BE `docs/api/checkout.md`):
 *   POST /api/v1/checkout          → CheckoutStartResponse    (200, nicht 201)
 *   POST /api/v1/checkout/complete → CheckoutCompleteResponse (200, obwohl anlegend)
 *
 * Beide Antworten werden an der Grenze gegen Zod geprüft (#38). Das ist hier
 * kein Selbstzweck: `complete` ist der einzige Pfad, der eine Bestellung anlegt,
 * und die daraus gelesene `orderId` geht direkt in die Zahlungserzeugung.
 */
import { z } from "zod"
import { apiRequest } from "@/src/lib/api-client"
import { parseApiResponse } from "@/src/lib/api-schemas"
import type { CheckoutDTO, CheckoutStartResponse, CheckoutCompleteResponse } from "@/src/types"

// ── Raw backend schemas ───────────────────────────────────────────────
// Zod spiegelt `CheckoutStartResponse` / `CheckoutCompleteResponse` aus
// `api/v1/checkout/dto/`. Die Zeilen tragen dieselben Summaries wie der
// Warenkorb (`CartProductSummaryResponse` / `CartVariantSummaryResponse`), also
// auch die lesbaren Varianten-Optionen.

const apiCheckoutAddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  street: z.string(),
  houseNumber: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
})

const apiCheckoutItemSchema = z.object({
  // Wechselt bewusst die Bedeutung: Cart-Item-Id beim Start, Order-Item-Id beim
  // Abschluss. Nicht über die Id korrelieren.
  id: z.string(),
  product: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    // Auf der Abschluss-Antwort laut Vertrag immer `null` — der eingefrorene
    // Bestell-Snapshot trägt kein Bild.
    primaryImage: z.string().nullable(),
  }),
  variant: z.object({
    id: z.string(),
    sku: z.string(),
    // Wie im Warenkorb tolerant gehalten: eine fehlende Dekoration darf die
    // Bestätigungsseite nicht mitreißen, ein kaputtes Optionspaar schon (#240).
    options: z.array(z.object({ type: z.string(), value: z.string() })).nullish(),
  }),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  currency: z.string(),
})

const apiCheckoutStartSchema = z.object({
  cartId: z.string(),
  ownershipType: z.string(),
  totalQuantity: z.number(),
  subtotal: z.number(),
  currency: z.string(),
  items: z.array(apiCheckoutItemSchema),
  shippingAddress: apiCheckoutAddressSchema,
  billingAddress: apiCheckoutAddressSchema,
})

const apiCheckoutCompleteSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  orderStatus: z.string(),
  paymentStatus: z.string(),
  paymentMethod: z.string(),
  completedAt: z.string(),
  checkout: apiCheckoutStartSchema,
})

type ApiCheckoutStart = z.infer<typeof apiCheckoutStartSchema>
type ApiCheckoutComplete = z.infer<typeof apiCheckoutCompleteSchema>

// ── Normalizer ────────────────────────────────────────────────────────
// Die Feldnamen stimmen mit dem FE-Modell überein; der Mapper normalisiert nur
// `options: null | undefined` auf die leere Liste, damit jeder Konsument eine
// Form sieht.

function normalizeCheckoutStart(raw: ApiCheckoutStart): CheckoutStartResponse {
  return {
    cartId: raw.cartId,
    ownershipType: raw.ownershipType,
    totalQuantity: raw.totalQuantity,
    subtotal: raw.subtotal,
    currency: raw.currency,
    items: raw.items.map((item) => ({
      id: item.id,
      product: item.product,
      variant: {
        id: item.variant.id,
        sku: item.variant.sku,
        options: item.variant.options ?? [],
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      currency: item.currency,
    })),
    shippingAddress: raw.shippingAddress,
    billingAddress: raw.billingAddress,
  }
}

function normalizeCheckoutComplete(raw: ApiCheckoutComplete): CheckoutCompleteResponse {
  return {
    orderId: raw.orderId,
    orderNumber: raw.orderNumber,
    orderStatus: raw.orderStatus,
    paymentStatus: raw.paymentStatus,
    paymentMethod: raw.paymentMethod,
    completedAt: raw.completedAt,
    checkout: normalizeCheckoutStart(raw.checkout),
  }
}

export const CheckoutService = {
  async preview(dto: CheckoutDTO): Promise<CheckoutStartResponse> {
    const raw = await apiRequest<unknown>("/api/v1/checkout", {
      method: "POST",
      body: JSON.stringify(dto),
    })
    return normalizeCheckoutStart(parseApiResponse(apiCheckoutStartSchema, raw, "checkout.preview"))
  },

  async complete(dto: CheckoutDTO): Promise<CheckoutCompleteResponse> {
    const raw = await apiRequest<unknown>("/api/v1/checkout/complete", {
      method: "POST",
      body: JSON.stringify(dto),
    })
    return normalizeCheckoutComplete(
      parseApiResponse(apiCheckoutCompleteSchema, raw, "checkout.complete")
    )
  },
}
