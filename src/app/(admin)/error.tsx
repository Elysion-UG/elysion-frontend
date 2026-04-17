"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { errorStore } from "@/src/lib/error-store"

export default function AdminError({
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
      metadata: { digest: error.digest, routeGroup: "admin" },
    })
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-900/30">
        <AlertTriangle className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-100">Etwas ist schiefgelaufen</h2>
      <p className="max-w-sm text-sm text-slate-400">
        Beim Laden dieser Seite ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-cyber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyber-700"
        >
          <RefreshCw className="h-4 w-4" />
          Erneut versuchen
        </button>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm hover:bg-slate-700"
        >
          <Home className="h-4 w-4" />
          Admin-Startseite
        </Link>
      </div>
    </div>
  )
}
