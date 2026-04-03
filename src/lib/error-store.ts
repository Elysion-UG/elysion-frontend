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

  /** Remove all stored events. */
  clear(): void {
    this.buffer.length = 0
  }
}

/** Global singleton — import this from anywhere. */
export const errorStore = new ErrorStore()
