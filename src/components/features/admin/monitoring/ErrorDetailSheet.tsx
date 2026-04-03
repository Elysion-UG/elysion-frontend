"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/src/components/ui/sheet"
import type { FrontendErrorEvent } from "@/src/types/error"
import { getSeverityBadge, getCategoryBadge } from "./badge-helpers"

interface ErrorDetailSheetProps {
  event: FrontendErrorEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ErrorDetailSheet({ event, open, onOpenChange }: ErrorDetailSheetProps) {
  if (!event) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-slate-800 bg-slate-950 text-slate-200 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-slate-100">Fehlerdetails</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto">
          {/* Badges */}
          <div className="flex items-center gap-2">
            {getSeverityBadge(event.severity)}
            {getCategoryBadge(event.category)}
          </div>

          {/* Message */}
          <div>
            <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Nachricht
            </p>
            <p className="text-sm text-slate-300">{event.message}</p>
          </div>

          {/* Timestamp */}
          <div>
            <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Zeitpunkt
            </p>
            <p className="font-mono text-sm text-slate-300">
              {new Date(event.timestamp).toLocaleString("de-DE")}
            </p>
          </div>

          {/* Stack trace */}
          {event.stack && (
            <div>
              <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Stack Trace
              </p>
              <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-400">
                {event.stack}
              </pre>
            </div>
          )}

          {/* Metadata */}
          <div>
            <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Metadaten
            </p>
            <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-400">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>

          {/* Raw JSON */}
          <div>
            <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Roh-JSON
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-400">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
