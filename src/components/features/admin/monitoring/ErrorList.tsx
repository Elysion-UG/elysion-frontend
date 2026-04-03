"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import type { FrontendErrorEvent, ErrorSeverity, ErrorCategory } from "@/src/types/error"
import { getSeverityBadge, getCategoryBadge } from "./badge-helpers"
import ErrorDetailSheet from "./ErrorDetailSheet"

interface ErrorListProps {
  events: readonly FrontendErrorEvent[]
  filterSeverity: ErrorSeverity | ""
  filterCategory: ErrorCategory | ""
}

const PAGE_SIZE = 25

export default function ErrorList({ events, filterSeverity, filterCategory }: ErrorListProps) {
  const [page, setPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<FrontendErrorEvent | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filtered = useMemo(() => {
    let result = [...events].reverse() // newest first
    if (filterSeverity) {
      result = result.filter((e) => e.severity === filterSeverity)
    }
    if (filterCategory) {
      result = result.filter((e) => e.category === filterCategory)
    }
    return result
  }, [events, filterSeverity, filterCategory])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageEvents = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleOpenDetail = (event: FrontendErrorEvent) => {
    setSelectedEvent(event)
    setSheetOpen(true)
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="border-b border-slate-800 px-6 py-4">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
          Fehlerliste ({filtered.length} Einträge)
        </h3>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-slate-500">Keine Fehler gefunden.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-mono font-semibold">Zeitpunkt</th>
                  <th className="px-6 py-3 font-mono font-semibold">Schweregrad</th>
                  <th className="px-6 py-3 font-mono font-semibold">Kategorie</th>
                  <th className="px-6 py-3 font-mono font-semibold">Nachricht</th>
                  <th className="px-6 py-3 font-mono font-semibold">URL</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {pageEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="cursor-pointer transition-colors hover:bg-slate-800/40"
                    onClick={() => handleOpenDetail(event)}
                  >
                    <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-3">{getSeverityBadge(event.severity)}</td>
                    <td className="px-6 py-3">{getCategoryBadge(event.category)}</td>
                    <td className="max-w-xs truncate px-6 py-3 text-slate-300">{event.message}</td>
                    <td className="max-w-[180px] truncate px-6 py-3 font-mono text-xs text-slate-500">
                      {event.metadata.apiPath ?? event.metadata.url ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <ExternalLink className="h-3.5 w-3.5 text-slate-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3">
              <p className="font-mono text-xs text-slate-500">
                Seite {page} von {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ErrorDetailSheet event={selectedEvent} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
