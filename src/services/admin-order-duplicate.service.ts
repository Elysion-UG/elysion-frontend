/**
 * AdminOrderDuplicateService — Review geflaggter Duplicate-Orders (Admin).
 *
 * Eigene Service-Datei statt eines Anbaus an `admin.service.ts`: dieser Bereich
 * validiert seine Antworten am Boundary (Zod), während `admin.service.ts` noch
 * durchcastet — und die Duplikat-Endpoints hängen an einem eigenen Backend-
 * Controller.
 *
 * **Vertragsgrenze:** `resolve` **protokolliert** die Entscheidung nur. Es
 * storniert nichts und erstattet nichts — auch nicht bei `CANCELLED_REFUNDED`.
 * Die Ausführung läuft über die bestehenden Erstattungs-Endpoints; einen
 * Admin-Storno-Endpoint gibt es noch nicht (Backend-Issue #220). Details:
 * `docs/api-integration.md` → „Duplicate-Order-Review".
 */
import { z } from "zod"
import { apiRequest, buildQuery } from "@/src/lib/api-client"
import { orderStatusSchema, parseApiResponse } from "@/src/lib/api-schemas"
import { normalizePage } from "@/src/lib/normalize-page"
import type {
  OrderDuplicateFlag,
  OrderDuplicateListParams,
  OrderDuplicateOrderRef,
  OrderDuplicateResolveDTO,
  OrderDuplicateResolveResult,
  OrderDuplicateStats,
  Page,
} from "@/src/types"

const BASE = "/api/v1/admin/orders/duplicates"

// ── Rohe Backend-Schemas ─────────────────────────────────────────────────────

export const duplicateFlagStatusSchema = z.enum(["OPEN", "RESOLVED"])
export const duplicateResolutionSchema = z.enum(["RELEASED", "CANCELLED_REFUNDED"])

/**
 * Nur `id` ist garantiert: kann das Backend die Bestellung zum Flag nicht
 * laden, liefert es einen Stub, in dem alle übrigen Felder `null` sind.
 */
const apiOrderRefSchema = z.object({
  id: z.string(),
  orderNumber: z.string().nullish(),
  userId: z.string().nullish(),
  guestEmail: z.string().nullish(),
  status: orderStatusSchema.nullish(),
  paymentStatus: z.string().nullish(),
  total: z.number().nullish(),
  currency: z.string().nullish(),
})

const apiDuplicateFlagSchema = z.object({
  id: z.string(),
  status: duplicateFlagStatusSchema,
  matchSignature: z.string(),
  secondsApart: z.number(),
  detectedAt: z.string(),
  resolution: duplicateResolutionSchema.nullish(),
  resolutionNote: z.string().nullish(),
  resolvedBy: z.string().nullish(),
  resolvedAt: z.string().nullish(),
  order: apiOrderRefSchema,
  duplicateOf: apiOrderRefSchema,
})

const apiDuplicateFlagPageSchema = z.object({
  items: z.array(apiDuplicateFlagSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
})

const apiDuplicateStatsSchema = z.object({
  total: z.number(),
  open: z.number(),
  resolved: z.number(),
})

const apiResolveResultSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  duplicateOfOrderId: z.string(),
  status: duplicateFlagStatusSchema,
  resolution: duplicateResolutionSchema,
  resolutionNote: z.string().nullish(),
  resolvedBy: z.string().nullish(),
  resolvedAt: z.string(),
})

type ApiOrderRef = z.infer<typeof apiOrderRefSchema>
type ApiDuplicateFlag = z.infer<typeof apiDuplicateFlagSchema>

// ── Normalizer ───────────────────────────────────────────────────────────────
// `nullish` am Boundary, `| null` im Domänentyp: die UI soll nicht zwischen
// „Feld fehlt" und „Feld ist null" unterscheiden müssen.

function normalizeOrderRef(raw: ApiOrderRef): OrderDuplicateOrderRef {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber ?? null,
    userId: raw.userId ?? null,
    guestEmail: raw.guestEmail ?? null,
    status: raw.status ?? null,
    paymentStatus: raw.paymentStatus ?? null,
    total: raw.total ?? null,
    currency: raw.currency ?? null,
  }
}

function normalizeFlag(raw: ApiDuplicateFlag): OrderDuplicateFlag {
  return {
    id: raw.id,
    status: raw.status,
    matchSignature: raw.matchSignature,
    secondsApart: raw.secondsApart,
    detectedAt: raw.detectedAt,
    resolution: raw.resolution ?? null,
    resolutionNote: raw.resolutionNote ?? null,
    resolvedBy: raw.resolvedBy ?? null,
    resolvedAt: raw.resolvedAt ?? null,
    order: normalizeOrderRef(raw.order),
    duplicateOf: normalizeOrderRef(raw.duplicateOf),
  }
}

export const AdminOrderDuplicateService = {
  /** Geflaggte Paare, neueste Erkennung zuerst. `status` filtert optional. */
  async list(params: OrderDuplicateListParams = {}): Promise<Page<OrderDuplicateFlag>> {
    const raw = await apiRequest<unknown>(
      `${BASE}${buildQuery({ page: params.page, size: params.size, status: params.status })}`
    )
    const page = parseApiResponse(apiDuplicateFlagPageSchema, raw, "admin-order-duplicate.list")
    return normalizePage(page, normalizeFlag)
  },

  async stats(): Promise<OrderDuplicateStats> {
    const raw = await apiRequest<unknown>(`${BASE}/stats`)
    return parseApiResponse(apiDuplicateStatsSchema, raw, "admin-order-duplicate.stats")
  },

  /**
   * Protokolliert die Entscheidung des Reviewers und setzt das Flag auf
   * `RESOLVED`. Führt sie **nicht** aus (siehe Datei-Doku).
   *
   * Idempotent bei gleicher `resolution` — ein Doppelklick ist der Normalfall,
   * kein Fehler. Eine erneut mitgeschickte Notiz wird dabei allerdings still
   * verworfen; maßgeblich ist deshalb immer die `resolutionNote` der Antwort,
   * nie der lokal getippte Text. Eine abweichende `resolution` beantwortet das
   * Backend mit `409`.
   */
  async resolve(id: string, dto: OrderDuplicateResolveDTO): Promise<OrderDuplicateResolveResult> {
    const raw = await apiRequest<unknown>(`${BASE}/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify(dto),
    })
    const result = parseApiResponse(apiResolveResultSchema, raw, "admin-order-duplicate.resolve")
    return {
      ...result,
      resolutionNote: result.resolutionNote ?? null,
      resolvedBy: result.resolvedBy ?? null,
    }
  },
}
