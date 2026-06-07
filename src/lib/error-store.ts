/**
 * error-store.ts — In-memory ring buffer for frontend error events.
 *
 * Singleton, framework-agnostic (no React dependency). Usable from api-client,
 * window error handlers, and React components alike.
 */

import type {
  FrontendErrorEvent,
  ErrorSeverity,
  ErrorCategory,
  ErrorStoreStats,
  ErrorEventMetadata,
} from "@/src/types/error"

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// ── Flush configuration (see docs/monitoring-api.md) ────────────────────────────

const FLUSH_INTERVAL_MS = 30_000
const FLUSH_THRESHOLD = 20
const MAX_BATCH = 50
const MESSAGE_MAX = 2000
const STACK_MAX = 8 * 1024
const MAX_BACKOFF_MS = 5 * 60 * 1000
const MONITORING_PATH = "/api/v1/monitoring/errors"

function monitoringEndpoint(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  return `${base}${MONITORING_PATH}`
}

/** Auto-flush + network are disabled during SSR and unit tests. */
function isFlushEnabled(): boolean {
  return typeof window !== "undefined" && process.env.NODE_ENV !== "test"
}

function getOrCreateSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const KEY = "monitoring_session_id"
    let id = window.sessionStorage.getItem(KEY)
    if (!id) {
      id = generateId()
      window.sessionStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return undefined
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value
}

/** Truncate oversized fields before transmitting. Pure — exported for tests. */
export function serializeErrorEvent(event: FrontendErrorEvent): FrontendErrorEvent {
  return {
    ...event,
    message: truncate(event.message, MESSAGE_MAX),
    stack: event.stack ? truncate(event.stack, STACK_MAX) : null,
  }
}

/** Build the request payload for the ingestion endpoint. Pure — exported for tests. */
export function buildErrorBatch(
  events: readonly FrontendErrorEvent[],
  sessionId?: string
): { sessionId?: string; events: FrontendErrorEvent[] } {
  return {
    sessionId,
    events: events.slice(0, MAX_BATCH).map(serializeErrorEvent),
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ErrorStoreListener = (event: FrontendErrorEvent) => void

export interface ReportErrorInput {
  severity: ErrorSeverity
  category: ErrorCategory
  message: string
  stack?: string | null
  metadata?: ErrorEventMetadata
}

// ── ErrorStore ────────────────────────────────────────────────────────────────

const MAX_ENTRIES = 500
const RATE_WINDOW_MS = 30 * 60 * 1000 // 30 minutes

class ErrorStore {
  private readonly buffer: FrontendErrorEvent[] = []
  private readonly listeners = new Set<ErrorStoreListener>()
  private isReporting = false

  // ── Flush state ──
  private readonly unflushed: FrontendErrorEvent[] = []
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private autoFlushStarted = false
  private isFlushing = false
  private consecutiveFailures = 0
  private nextFlushAllowedAt = 0

  /** Record a new error event. Fire-and-forget — never throws. */
  report(input: ReportErrorInput): void {
    if (this.isReporting) return
    this.isReporting = true
    try {
      const event: FrontendErrorEvent = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        severity: input.severity,
        category: input.category,
        message: input.message,
        stack: input.stack ?? null,
        metadata: {
          url: typeof window !== "undefined" ? window.location.href : undefined,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          ...input.metadata,
        },
      }

      this.buffer.push(event)
      // FIFO eviction
      if (this.buffer.length > MAX_ENTRIES) {
        this.buffer.splice(0, this.buffer.length - MAX_ENTRIES)
      }

      // Queue for backend persistence (independent of display eviction)
      this.unflushed.push(event)
      this.ensureAutoFlush()
      if (this.unflushed.length >= FLUSH_THRESHOLD) {
        void this.flush()
      }

      for (const listener of this.listeners) {
        try {
          listener(event)
        } catch {
          // Never let a listener crash the reporter
        }
      }
    } finally {
      this.isReporting = false
    }
  }

  /** Number of events still awaiting backend persistence. */
  getUnflushedCount(): number {
    return this.unflushed.length
  }

  /** Lazily start the periodic flush + page-unload beacon (browser only). */
  private ensureAutoFlush(): void {
    if (this.autoFlushStarted || !isFlushEnabled()) return
    this.autoFlushStarted = true
    this.flushTimer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS)
    window.addEventListener("beforeunload", () => this.flushBeacon())
  }

  /**
   * Send queued events to the backend. Uses a direct `fetch` (never the
   * api-client) to avoid the flush→report→flush loop, and fails silently so
   * events remain queued for the next attempt. Applies exponential backoff.
   */
  async flush(): Promise<void> {
    if (!isFlushEnabled() || this.isFlushing) return
    if (this.unflushed.length === 0 || Date.now() < this.nextFlushAllowedAt) return

    this.isFlushing = true
    const batch = this.unflushed.slice(0, MAX_BATCH)
    try {
      const res = await fetch(monitoringEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildErrorBatch(batch, getOrCreateSessionId())),
      })
      if (!res.ok) throw new Error(`monitoring ingest failed: ${res.status}`)

      const sent = new Set(batch.map((e) => e.id))
      for (let i = this.unflushed.length - 1; i >= 0; i--) {
        if (sent.has(this.unflushed[i].id)) this.unflushed.splice(i, 1)
      }
      this.consecutiveFailures = 0
      this.nextFlushAllowedAt = 0
    } catch {
      this.consecutiveFailures++
      const backoff = Math.min(
        FLUSH_INTERVAL_MS * 2 ** (this.consecutiveFailures - 1),
        MAX_BACKOFF_MS
      )
      this.nextFlushAllowedAt = Date.now() + backoff
    } finally {
      this.isFlushing = false
    }
  }

  /** Best-effort flush on page unload via sendBeacon (keepalive fetch fallback). */
  private flushBeacon(): void {
    if (!isFlushEnabled() || this.unflushed.length === 0) return
    const payload = JSON.stringify(buildErrorBatch(this.unflushed, getOrCreateSessionId()))
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(
          monitoringEndpoint(),
          new Blob([payload], { type: "application/json" })
        )
      } else {
        void fetch(monitoringEndpoint(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        })
      }
    } catch {
      // Best effort — ignore failures during unload
    }
  }

  /** Return all stored events (oldest first). */
  getAll(): readonly FrontendErrorEvent[] {
    return this.buffer
  }

  /** Return the most recent `n` events (newest first). */
  getRecent(n: number): FrontendErrorEvent[] {
    return this.buffer.slice(-n).reverse()
  }

  /** Filter events by severity. */
  getBySeverity(severity: ErrorSeverity): FrontendErrorEvent[] {
    return this.buffer.filter((e) => e.severity === severity)
  }

  /** Filter events by category. */
  getByCategory(category: ErrorCategory): FrontendErrorEvent[] {
    return this.buffer.filter((e) => e.category === category)
  }

  /** Subscribe to new error events. Returns an unsubscribe function. */
  subscribe(listener: ErrorStoreListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Aggregate statistics over the current buffer. */
  getStats(): ErrorStoreStats {
    const bySeverity: Record<ErrorSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    const byCategory: Record<ErrorCategory, number> = {
      api: 0,
      auth: 0,
      render: 0,
      network: 0,
      unknown: 0,
    }

    for (const e of this.buffer) {
      bySeverity[e.severity]++
      byCategory[e.category]++
    }

    // Error rate: count events in the last 30 min, divide by 30
    const cutoff = Date.now() - RATE_WINDOW_MS
    const recentCount = this.buffer.filter((e) => new Date(e.timestamp).getTime() > cutoff).length
    const errorsPerMinute = Math.round((recentCount / 30) * 100) / 100

    return {
      total: this.buffer.length,
      bySeverity,
      byCategory,
      errorsPerMinute,
    }
  }

  /** Remove all stored events (display buffer + pending flush queue). */
  clear(): void {
    this.buffer.length = 0
    this.unflushed.length = 0
  }
}

/** Global singleton — import this from anywhere. */
export const errorStore = new ErrorStore()
