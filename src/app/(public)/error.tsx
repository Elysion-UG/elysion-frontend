"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { errorStore } from "@/src/lib/error-store"

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    errorStore.report({
      severity: "high",
      category: "render",
      message: error.message,
      stack: error.stack ?? null,
      metadata: { digest: error.digest, routeGroup: "public" },
    })
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-7 w-7 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">Etwas ist schiefgelaufen</h2>
      <p className="max-w-sm text-sm text-gray-500">
        Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Home className="h-4 w-4" />
          Startseite
        </a>
      </div>
    </div>
  )
}
