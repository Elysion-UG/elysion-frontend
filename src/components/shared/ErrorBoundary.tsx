"use client"

import React, { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { errorStore } from "@/src/lib/error-store"

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback UI. */
  fallback?: ReactNode
  /** Callback when an error is caught. */
  onError?: (error: Error, info: ErrorInfo) => void
  /** Controls the fallback size/style: "page" fills the area, "section" is inline. */
  level?: "page" | "section"
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    errorStore.report({
      severity: "high",
      category: "render",
      message: error.message,
      stack: error.stack ?? null,
      metadata: {
        component: info.componentStack ?? undefined,
      },
    })
    this.props.onError?.(error, info)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    const level = this.props.level ?? "section"

    if (level === "page") {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Etwas ist schiefgelaufen
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Erneut versuchen
          </button>
        </div>
      )
    }

    // Section-level: compact inline alert
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Dieser Bereich konnte nicht geladen werden.
            </p>
            <button
              onClick={this.handleRetry}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    )
  }
}
