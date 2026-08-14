/** Severity levels for frontend error events. */
export type ErrorSeverity = "critical" | "high" | "medium" | "low"

/** Categories classifying the source of a frontend error. */
export type ErrorCategory = "api" | "auth" | "render" | "network" | "unknown"

/** Structured metadata attached to every captured error event. */
export interface ErrorEventMetadata {
  /** Page URL where the error occurred. */
  url?: string
  /** React component name (for render errors). */
  component?: string
  /** HTTP status code (for API errors). */
  statusCode?: number
  /** API path that failed (for API errors). */
  apiPath?: string
  /** Authenticated user ID at the time of error, if any. */
  userId?: string
  /** Browser user-agent string. */
  userAgent?: string
  /** Arbitrary extra context. */
  [key: string]: unknown
}

/** A single captured frontend error event. */
export interface FrontendErrorEvent {
  /** Unique identifier (crypto.randomUUID or fallback). */
  id: string
  /** ISO-8601 timestamp when the error was captured. */
  timestamp: string
  /** How severe this error is. */
  severity: ErrorSeverity
  /** What kind of error this is. */
  category: ErrorCategory
  /** Human-readable error message. */
  message: string
  /** Stack trace, if available. */
  stack: string | null
  /** Structured metadata. */
  metadata: ErrorEventMetadata
}

/**
 * Aggregated stats returned by the error store — **und**, nach dem Mapping in
 * `monitoring.service.ts`, vom Admin-Stats-Endpunkt. Die Schlüssel von
 * `bySeverity`/`byCategory` sind hier ausnahmslos lowercase; der Server liefert
 * sie UPPERCASE, die Übersetzung passiert im Service (#254). Diesen Typ also
 * nicht als 1:1-Abbild der API lesen.
 */
export interface ErrorStoreStats {
  total: number
  bySeverity: Record<ErrorSeverity, number>
  byCategory: Record<ErrorCategory, number>
  /** Errors per minute averaged over the last 30 minutes. */
  errorsPerMinute: number
}

/**
 * A frontend error event as persisted and returned by the backend
 * (`GET /api/v1/admin/monitoring/errors`). Promoted fields are flattened
 * out of the client-side `metadata` object; see `docs/monitoring-api.md`.
 *
 * Beschreibt den **gemappten** Zustand: `severity`/`category` stehen hier
 * lowercase wie im Client-Buffer, der Server liefert sie UPPERCASE. Die
 * Übersetzung liegt in `monitoring.service.ts` (#254) — dieser Typ ist also
 * kein 1:1-Abbild der Antwort.
 */
export interface PersistedErrorEvent {
  id: string
  clientEventId: string
  sessionId: string | null
  severity: ErrorSeverity
  category: ErrorCategory
  message: string
  stack: string | null
  url: string | null
  apiPath: string | null
  statusCode: number | null
  component: string | null
  userId: string | null
  userAgent: string | null
  metadata: Record<string, unknown> | null
  clientTimestamp: string
  createdAt: string
}
