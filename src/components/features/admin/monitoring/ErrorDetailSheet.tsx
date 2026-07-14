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
      <SheetContent className="w-full border-border bg-ink-900 text-muted-foreground sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-muted-foreground">Fehlerdetails</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto">
          {/* Badges */}
          <div className="flex items-center gap-2">
            {getSeverityBadge(event.severity)}
            {getCategoryBadge(event.category)}
          </div>

          {/* Message */}
          <div>
            <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nachricht
            </p>
            <p className="text-sm text-muted-foreground">{event.message}</p>
          </div>

          {/* Timestamp */}
          <div>
            <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Zeitpunkt
            </p>
            <p className="font-mono text-sm text-muted-foreground">
              {new Date(event.timestamp).toLocaleString("de-DE")}
            </p>
          </div>

          {/* Stack trace */}
          {event.stack && (
            <div>
              <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Stack Trace
              </p>
              <pre className="max-h-64 overflow-auto rounded-lg bg-ink-900 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                {event.stack}
              </pre>
            </div>
          )}

          {/* Metadata */}
          <div>
            <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Metadaten
            </p>
            <pre className="max-h-48 overflow-auto rounded-lg bg-ink-900 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>

          {/* Raw JSON */}
          <div>
            <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Roh-JSON
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-ink-900 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
