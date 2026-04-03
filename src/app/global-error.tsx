"use client"

import { useEffect } from "react"
import { errorStore } from "@/src/lib/error-store"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    errorStore.report({
      severity: "critical",
      category: "render",
      message: error.message,
      stack: error.stack ?? null,
      metadata: { digest: error.digest },
    })
  }, [error])

  return (
    <html lang="de">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900">Kritischer Fehler</h1>
          <p className="mb-6 text-sm text-gray-600">
            Die Anwendung hat einen schwerwiegenden Fehler festgestellt. Bitte versuchen Sie es
            erneut oder kehren Sie zur Startseite zurück.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={reset}
              className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              Erneut versuchen
            </button>
            <a
              href="/"
              className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Zur Startseite
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
