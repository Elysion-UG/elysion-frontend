"use client"

import React, { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/src/components/ui/button"
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
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-tint">
            <AlertTriangle className="h-7 w-7 text-danger" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Etwas ist schiefgelaufen</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
            </p>
          </div>
          <Button onClick={this.handleRetry}>
            <RefreshCw className="h-4 w-4" />
            Erneut versuchen
          </Button>
        </div>
      )
    }

    // Section-level: compact inline alert
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-tint p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-danger">
              Dieser Bereich konnte nicht geladen werden.
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={this.handleRetry}
              className="mt-2 h-auto px-0 text-danger"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Erneut versuchen
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
