/**
 * OrderService — käuferseitige Bestell-Reads.
 *
 * Endpunkte (BE `docs/api/orders.md`, Abschnitt „Buyer Reads"):
 *   GET /api/v1/orders       → PagedResponse<OrderSummaryResponse>
 *   GET /api/v1/orders/{id}  → OrderDetailResponse
 *
 * Die Route-Familien sind laut Vertrag nicht austauschbar: `/api/v1/seller/orders`
 * liefert eine ganz andere Form (`SellerOrderGroupResponse`) und liegt in
 * `seller-order.service.ts`.
 */
import { z } from "zod"
import { apiRequest, buildQuery } from "@/src/lib/api-client"
import { errorStore } from "@/src/lib/error-store"
import { normalizePage } from "@/src/lib/normalize-page"
import { parseApiResponse, orderGroupStatusSchema, orderStatusSchema } from "@/src/lib/api-schemas"
import type { Order, OrderDetail, OrderGroup, OrderItem } from "@/src/types"
import { apiOrderProductSnapshotSchema, normalizeSnapshot } from "./_order-normalizers"

// Safely narrow a backend status string to one of our known enum values.
// Unknown values from the server fall back to a sane default and are reported
// to the error store so contract drift is visible without using console.* in
// production. This is preferable to `as` casts that silently render an
// undefined status badge.
//
// Bewusst weich, anders als die Strukturprüfung darunter: ein neuer Statuswert
// ist eine additive Backend-Änderung und darf keine ganze Bestellliste
// abschießen — ein fehlendes Preisfeld schon.
function parseOrderStatus(raw: string | undefined): OrderDetail["status"] {
  if (!raw) return undefined
  const result = orderStatusSchema.safeParse(raw)
  if (result.success) return result.data
  errorStore.report({
    severity: "low",
    category: "api",
    message: `[order.service] unknown order status from backend: ${raw}`,
  })
  return "PENDING"
}

function parseOrderGroupStatus(raw: string): OrderGroup["status"] {
  const result = orderGroupStatusSchema.safeParse(raw)
  if (result.success) return result.data
  errorStore.report({
    severity: "low",
    category: "api",
    message: `[order.service] unknown order-group status from backend: ${raw}`,
  })
  return "PENDING"
}

export interface OrderListParams {
  page?: number
  size?: number
  status?: string
}

// ── Raw backend schemas ───────────────────────────────────────────────
// Zod spiegelt exakt die Records aus `api/v1/orders/dto/`. Validiert wird an der
// Service-Grenze (`parseApiResponse`), damit Vertragsdrift auf dem Geldpfad laut
// fehlschlägt statt als `undefined` in der Bestell-UI aufzuschlagen (#38).
//
// Die früheren „manche API-Versionen benutzen schon die normalisierten Namen"-
// Alternativen (`pricePerUnit`, `subtotal`, `sellerId`, `shippingCost`,
// `productSnapshot`) sind ersatzlos weg: keine davon existiert im Backend.
// Sie haben nie gegriffen und hätten eine echte Umbenennung stumm überdeckt.

const apiOrderAddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  street: z.string(),
  houseNumber: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
})

/**
 * `shipmentResponse` im Backend baut das Record auch dann, wenn nur
 * `deliveredAt` gesetzt ist — `trackingNumber` und `carrier` sind dann `null`.
 * Deshalb nullable statt `z.string()`.
 */
const apiOrderShipmentSchema = z.object({
  trackingNumber: z.string().nullable(),
  carrier: z.string().nullable(),
  shippedAt: z.string().nullish(),
  deliveredAt: z.string().nullish(),
})

const apiOrderItemSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  // Der Vertrag nennt das Feld `product` (nicht `productSnapshot`) und
  // konstruiert es bedingungslos; die einzelnen Felder darin dürfen null sein.
  product: apiOrderProductSnapshotSchema,
  unitPrice: z.number(),
  lineTotal: z.number(),
  currency: z.string().nullish(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
})

const apiOrderGroupSchema = z.object({
  id: z.string(),
  // Immer vorhanden; `id` kann laut Snapshot-Mapper null sein.
  seller: z.object({ id: z.string().nullish() }).nullish(),
  status: z.string(),
  subtotal: z.number(),
  shipping: z.number(),
  shipment: apiOrderShipmentSchema.nullish(),
  items: z.array(apiOrderItemSchema),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
})

const apiOrderDetailSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  subtotal: z.number(),
  // Der Vertrag heißt `shipping`, nicht `shippingCost` — das FE-Modell heißt
  // andersherum, deshalb bildet der Mapper unten um.
  shipping: z.number(),
  tax: z.number().nullish(),
  total: z.number(),
  currency: z.string(),
  shippingAddress: apiOrderAddressSchema,
  groups: z.array(apiOrderGroupSchema),
  createdAt: z.string(),
})

const apiOrderSummarySchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  paymentStatus: z.string().nullish(),
  total: z.number(),
  currency: z.string(),
  createdAt: z.string(),
})

/** Kanonischer Paged-Envelope des Backends (`PagedResponse`). */
const apiOrderPageSchema = z.object({
  items: z.array(apiOrderSummarySchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
})

type ApiOrderItem = z.infer<typeof apiOrderItemSchema>
type ApiOrderGroup = z.infer<typeof apiOrderGroupSchema>
type ApiOrderDetail = z.infer<typeof apiOrderDetailSchema>
type ApiOrderSummary = z.infer<typeof apiOrderSummarySchema>

// ── Normalisation helpers ─────────────────────────────────────────────

function normalizeItem(raw: ApiOrderItem): OrderItem {
  const snapshot = normalizeSnapshot(raw.product)
  return {
    id: raw.id,
    // Die Variante steckt im eingefrorenen Snapshot; auf der Zeile selbst gibt
    // es kein `variantId` — das las das FE bisher ins Leere.
    variantId: snapshot.variantId,
    quantity: raw.quantity,
    pricePerUnit: raw.unitPrice,
    subtotal: raw.lineTotal,
    productSnapshot: snapshot,
  }
}

function normalizeGroup(raw: ApiOrderGroup): OrderGroup {
  return {
    id: raw.id,
    sellerId: raw.seller?.id ?? undefined,
    status: parseOrderGroupStatus(raw.status),
    subtotal: raw.subtotal,
    shippingCost: raw.shipping,
    shipment: raw.shipment
      ? { trackingNumber: raw.shipment.trackingNumber, carrier: raw.shipment.carrier ?? undefined }
      : null,
    items: raw.items.map(normalizeItem),
  }
}

function normalizeOrderDetail(raw: ApiOrderDetail): OrderDetail {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    status: parseOrderStatus(raw.status),
    createdAt: raw.createdAt,
    shippingAddress: raw.shippingAddress,
    groups: raw.groups.map(normalizeGroup),
    subtotal: raw.subtotal,
    shippingCost: raw.shipping,
    tax: raw.tax ?? null,
    total: raw.total,
    currency: raw.currency,
  }
}

function normalizeOrderSummary(raw: ApiOrderSummary): Order {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    // Ohne die Verengung hier landete ein unbekannter Status ungeprüft als
    // Schlüssel in den Label-/Farb-Maps der Bestellliste und rendert leer.
    status: parseOrderStatus(raw.status) ?? "PENDING",
    paymentStatus: raw.paymentStatus ?? undefined,
    total: raw.total,
    currency: raw.currency,
    createdAt: raw.createdAt,
  }
}

// ── Service ───────────────────────────────────────────────────────────

export const OrderService = {
  async list(params: OrderListParams = {}): Promise<Order[]> {
    const raw = await apiRequest<unknown>(
      `/api/v1/orders${buildQuery({ page: params.page, size: params.size, status: params.status })}`
    )
    const page = parseApiResponse(apiOrderPageSchema, raw, "order.list")
    return normalizePage(page, normalizeOrderSummary).items
  },

  async getById(id: string): Promise<OrderDetail> {
    const raw = await apiRequest<unknown>(`/api/v1/orders/${id}`)
    return normalizeOrderDetail(parseApiResponse(apiOrderDetailSchema, raw, "order.getById"))
  },
}
