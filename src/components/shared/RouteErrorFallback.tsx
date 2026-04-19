"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import { errorStore } from "@/src/lib/error-store"
import type { ErrorEventMetadata } from "@/src/types/error"

export type RouteErrorTheme = "light" | "dark"

export interface RouteErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  routeGroup: "public" | "buyer" | "seller" | "admin"
  homeHref: string
  homeLabel: string
  theme?: RouteErrorTheme
}

export function RouteErrorFallback({
  error,
  reset,
  routeGroup,
  homeHref,
  homeLabel,
  theme = "light",
}: RouteErrorFallbackProps) {
  useEffect(() => {
    const metadata: ErrorEventMetadata = { digest: error.digest, routeGroup }
    errorStore.report({
      severity: "high",
      category: "render",
      message: error.message,
      stack: error.stack ?? null,
      metadata,
    })
  }, [error, routeGroup])

  const t =
    theme === "dark"
      ? {
          iconBg: "bg-red-900/30",
          icon: "text-red-400",
          heading: "text-slate-100",
          body: "text-slate-400",
          primaryBtn: "bg-cyber-600 hover:bg-cyber-700",
          secondaryBtn: "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700",
        }
      : {
          iconBg: "bg-red-100",
          icon: "text-red-600",
          heading: "text-gray-900",
          body: "text-gray-500",
          primaryBtn: "bg-emerald-600 hover:bg-emerald-700",
          secondaryBtn: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${t.iconBg}`}>
        <AlertTriangle className={`h-7 w-7 ${t.icon}`} />
      </div>
      <h2 className={`text-lg font-semibold ${t.heading}`}>Etwas ist schiefgelaufen</h2>
      <p className={`max-w-sm text-sm ${t.body}`}>
        Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${t.primaryBtn}`}
        >
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </button>
        <Link
          href={homeHref}
          className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium shadow-sm ${t.secondaryBtn}`}
        >
          <Home className="h-4 w-4" />
          {homeLabel}
        </Link>
      </div>
    </div>
  )
}
