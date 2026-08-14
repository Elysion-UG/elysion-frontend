/**
 * MonitoringService — Admin-Reads für persistierte Frontend-Fehlerereignisse.
 *
 * ADMIN-Rolle. Endpoint-Katalog: docs/api-integration.md.
 *
 * Die Ingestion (Frontend → Backend) läuft separat über den Flush-Mechanismus
 * in `src/lib/error-store.ts` (POST /api/v1/monitoring/errors, public).
 * Spezifikation: `docs/monitoring-api.md`.
 *
 * ── Groß-/Kleinschreibung, der Grund für die Mapper unten (#254) ─────────────
 * Client-Buffer und Server sprechen nicht dieselbe Schreibweise:
 *
 *   • Client-Vokabular (In-Memory-Buffer, Typen, UI, und die Parameter dieses
 *     Services) — lowercase: `"high"`, `"api"`.
 *   • Server-Vokabular (Antworten dieser Reads **und** die Query-Filter) —
 *     UPPERCASE: `"HIGH"`, `"API"`, bei den Stats sogar als Record-SCHLÜSSEL
 *     (`bySeverity: { "CRITICAL": 2, … }`).
 *
 * Übersetzt wird deshalb in beide Richtungen, und die Grenze verläuft genau hier:
 * nach außen sprechen Aufrufer ausschließlich lowercase.
 *
 * Die Typen `ErrorSeverity`/`ErrorCategory` beschreiben die lowercase-Variante.
 * Bis #254 gaben beide Methoden die Antwort ungeprüft und ungemappt durch — kein
 * Typfehler, keine Exception, sondern stille Fehldarstellung beim ersten
 * Konsumenten: Badges ohne Beschriftung, ein Filter der nie matcht, `NaN` im
 * Trend-Chart. Deshalb hier Schema + Mapper, und zwar als explizite Tabelle statt
 * `.toLowerCase() as ErrorSeverity`: die Tabelle bricht den Typecheck, sobald sich
 * eine der beiden Unions ändert, der Cast würde still weiterlügen.
 *
 * ── Noch nicht gegen ein echtes Backend geprüft ──────────────────────────────
 * Die Schemata sind gegen `docs/monitoring-api.md` (Backend-Vertrag `docs/api/
 * monitoring.md`) geschrieben. Auf dem Stage-Backend antworten die Routen noch
 * nicht: BE#115 ist umgesetzt, aber Backend-`dev` liegt vor Backend-`stage`, und
 * die OpenAPI des laufenden Stage-Deploys führt keinen Monitoring-Pfad. Der erste
 * echte Aufruf scheitert dank `parseApiResponse` laut und benennbar statt still.
 */
import { z } from "zod"
import { apiRequest, buildQuery } from "@/src/lib/api-client"
import { parseApiResponse } from "@/src/lib/api-schemas"
import { normalizePage } from "@/src/lib/normalize-page"
import type {
  Page,
  PersistedErrorEvent,
  ErrorStoreStats,
  ErrorSeverity,
  ErrorCategory,
} from "@/src/types"

export interface MonitoringErrorListParams {
  page?: number
  size?: number
  /**
   * Filter im **Client-Vokabular** (lowercase). Der Service übersetzt beim
   * Absenden nach UPPERCASE — bewusst getippt statt `string`: Wer einen Wert aus
   * einem gelesenen Event (`event.severity === "high"`) oder aus den Schlüsseln
   * von `SEVERITY_LABELS` weiterreicht, bekäme sonst klaglos `?severity=high`,
   * und das Backend antwortet mit 400 oder einer leeren Seite — also wieder eine
   * still leere Tabelle.
   */
  severity?: ErrorSeverity
  /** Filter im Client-Vokabular (lowercase); Übersetzung wie bei `severity`. */
  category?: ErrorCategory
  from?: string
  to?: string
  sessionId?: string
}

// ── Raw API schemas ──────────────────────────────────────────────────────────
// Gegen die dokumentierte Antwort geschrieben und am Rand validiert, damit
// Contract-Drift laut scheitert statt als leere Tabellenzelle durchzurutschen
// (#38). Monitoring-lokal gehalten: außer diesem Service liest sie niemand.

const apiErrorSeveritySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
const apiErrorCategorySchema = z.enum(["API", "AUTH", "RENDER", "NETWORK", "UNKNOWN"])

type ApiErrorSeverity = z.infer<typeof apiErrorSeveritySchema>
type ApiErrorCategory = z.infer<typeof apiErrorCategorySchema>

/** UPPERCASE der Server-Antwort → lowercase des Client-Vokabulars. */
const SEVERITY_FROM_API: Record<ApiErrorSeverity, ErrorSeverity> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
}

const CATEGORY_FROM_API: Record<ApiErrorCategory, ErrorCategory> = {
  API: "api",
  AUTH: "auth",
  RENDER: "render",
  NETWORK: "network",
  UNKNOWN: "unknown",
}

/**
 * Die Gegenrichtung für die Query-Filter. Der Service übersetzt in **beide**
 * Richtungen, sonst wäre er nur halb ehrlich: Wer eine gelesene (lowercase)
 * Severity als Filter zurückgibt, träfe sonst ins Leere.
 */
const SEVERITY_TO_API: Record<ErrorSeverity, ApiErrorSeverity> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
}

const CATEGORY_TO_API: Record<ErrorCategory, ApiErrorCategory> = {
  api: "API",
  auth: "AUTH",
  render: "RENDER",
  network: "NETWORK",
  unknown: "UNKNOWN",
}

const apiPersistedErrorEventSchema = z.object({
  id: z.string(),
  clientEventId: z.string(),
  sessionId: z.string().nullish(),
  severity: apiErrorSeveritySchema,
  category: apiErrorCategorySchema,
  message: z.string(),
  stack: z.string().nullish(),
  url: z.string().nullish(),
  apiPath: z.string().nullish(),
  statusCode: z.number().nullish(),
  component: z.string().nullish(),
  userId: z.string().nullish(),
  userAgent: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  clientTimestamp: z.string(),
  createdAt: z.string(),
})

const apiErrorEventPageSchema = z.object({
  items: z.array(apiPersistedErrorEventSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
})

// Die Aggregate tragen dieselben UPPERCASE-Werte als Record-SCHLÜSSEL.
// Bewusst `partialRecord` statt `record`: Ein Backend darf eine leere Stufe
// weglassen — das ist keine Drift, sondern eine Null. Ein falsch geschriebener
// Schlüssel (lowercase, umbenannt) fällt trotzdem durch, und genau der ist der
// Fehlerfall aus #254. Die fehlenden Stufen füllt normalizeStats mit 0 auf.
const apiErrorStatsSchema = z.object({
  total: z.number(),
  bySeverity: z.partialRecord(apiErrorSeveritySchema, z.number()),
  byCategory: z.partialRecord(apiErrorCategorySchema, z.number()),
  errorsPerMinute: z.number(),
})

type ApiPersistedErrorEvent = z.infer<typeof apiPersistedErrorEventSchema>
type ApiErrorStats = z.infer<typeof apiErrorStatsSchema>

function normalizeEvent(raw: ApiPersistedErrorEvent): PersistedErrorEvent {
  return {
    id: raw.id,
    clientEventId: raw.clientEventId,
    sessionId: raw.sessionId ?? null,
    severity: SEVERITY_FROM_API[raw.severity],
    category: CATEGORY_FROM_API[raw.category],
    message: raw.message,
    stack: raw.stack ?? null,
    url: raw.url ?? null,
    apiPath: raw.apiPath ?? null,
    statusCode: raw.statusCode ?? null,
    component: raw.component ?? null,
    userId: raw.userId ?? null,
    userAgent: raw.userAgent ?? null,
    metadata: raw.metadata ?? null,
    clientTimestamp: raw.clientTimestamp,
    createdAt: raw.createdAt,
  }
}

function normalizeStats(raw: ApiErrorStats): ErrorStoreStats {
  // Über die Mapper-Tabellen iteriert, nicht über die Antwort: So sind alle
  // Stufen im Ergebnis besetzt, auch wenn der Server eine leere Kategorie
  // weglässt — `bySeverity.critical` ist dann 0 und nicht `undefined`.
  const bySeverity = {} as Record<ErrorSeverity, number>
  for (const [apiKey, key] of Object.entries(SEVERITY_FROM_API) as [
    ApiErrorSeverity,
    ErrorSeverity,
  ][]) {
    bySeverity[key] = raw.bySeverity[apiKey] ?? 0
  }

  const byCategory = {} as Record<ErrorCategory, number>
  for (const [apiKey, key] of Object.entries(CATEGORY_FROM_API) as [
    ApiErrorCategory,
    ErrorCategory,
  ][]) {
    byCategory[key] = raw.byCategory[apiKey] ?? 0
  }

  return { total: raw.total, bySeverity, byCategory, errorsPerMinute: raw.errorsPerMinute }
}

export const MonitoringService = {
  async getErrors(params: MonitoringErrorListParams = {}): Promise<Page<PersistedErrorEvent>> {
    const raw = await apiRequest<unknown>(
      `/api/v1/admin/monitoring/errors${buildQuery({
        page: params.page,
        size: params.size,
        severity: params.severity && SEVERITY_TO_API[params.severity],
        category: params.category && CATEGORY_TO_API[params.category],
        from: params.from,
        to: params.to,
        sessionId: params.sessionId,
      })}`
    )
    const page = parseApiResponse(apiErrorEventPageSchema, raw, "monitoring.getErrors")
    return normalizePage(page, normalizeEvent)
  },

  async getErrorStats(hours = 24): Promise<ErrorStoreStats> {
    const raw = await apiRequest<unknown>(
      `/api/v1/admin/monitoring/errors/stats${buildQuery({ hours })}`
    )
    return normalizeStats(parseApiResponse(apiErrorStatsSchema, raw, "monitoring.getErrorStats"))
  },
}
