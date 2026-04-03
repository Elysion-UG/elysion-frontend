"use client"

import { createContext, useContext, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { errorStore, type ReportErrorInput } from "@/src/lib/error-store"
import type { ErrorSeverity, ErrorCategory } from "@/src/types/error"

// ── Context ───────────────────────────────────────────────────────────────────

interface ErrorContextValue {
  /** Manually report an error from any component. */
  reportError: (input: ReportErrorInput) => void
}

const ErrorContext = createContext<ErrorContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function ErrorProvider({ children }: { children: ReactNode }) {
  // Register global window error handlers
  useEffect(() => {
    function handleWindowError(event: ErrorEvent) {
      errorStore.report({
        severity: "high",
        category: "unknown",
        message: event.message || "Unbekannter Fehler",
        stack: event.error?.stack ?? null,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const error = event.reason
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Unhandled promise rejection"
      const stack = error instanceof Error ? (error.stack ?? null) : null

      // Determine category from error type
      let category: ErrorCategory = "unknown"
      let severity: ErrorSeverity = "high"
      if (error && typeof error === "object" && "name" in error && error.name === "ApiError") {
        category = "api"
        severity =
          (error as { status?: number }).status && (error as { status: number }).status >= 500
            ? "high"
            : "medium"
      }

      errorStore.report({ severity, category, message, stack })
    }

    window.addEventListener("error", handleWindowError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleWindowError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  const reportError = useCallback((input: ReportErrorInput) => {
    errorStore.report(input)
  }, [])

  const value = useMemo(() => ({ reportError }), [reportError])

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useErrorReporter(): ErrorContextValue {
  const ctx = useContext(ErrorContext)
  if (!ctx) {
    throw new Error("useErrorReporter must be used within an <ErrorProvider>")
  }
  return ctx
}
