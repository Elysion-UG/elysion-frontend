"use client"

import { useState, useMemo } from "react"
import { ExternalLink } from "lucide-react"
import type { FrontendErrorEvent, ErrorSeverity, ErrorCategory } from "@/src/types/error"
import { getSeverityBadge, getCategoryBadge } from "./badge-helpers"
import ErrorDetailSheet from "./ErrorDetailSheet"
import { AdminTablePagination, ADMIN_TR_CLICKABLE_CLASS } from "@/src/components/shared"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                  <TableHead className="px-6 py-3 font-mono font-semibold">Zeitpunkt</TableHead>
                  <TableHead className="px-6 py-3 font-mono font-semibold">Schweregrad</TableHead>
                  <TableHead className="px-6 py-3 font-mono font-semibold">Kategorie</TableHead>
                  <TableHead className="px-6 py-3 font-mono font-semibold">Nachricht</TableHead>
                  <TableHead className="px-6 py-3 font-mono font-semibold">URL</TableHead>
                  <TableHead className="px-3 py-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageEvents.map((event) => (
                  <TableRow
                    key={event.id}
                    className={ADMIN_TR_CLICKABLE_CLASS}
                    onClick={() => handleOpenDetail(event)}
                  >
                    <TableCell className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="px-6 py-3">{getSeverityBadge(event.severity)}</TableCell>
                    <TableCell className="px-6 py-3">{getCategoryBadge(event.category)}</TableCell>
                    <TableCell className="max-w-xs truncate px-6 py-3 text-slate-300">
                      {event.message}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate px-6 py-3 font-mono text-xs text-slate-500">
                      {event.metadata.apiPath ?? event.metadata.url ?? "—"}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <ExternalLink className="h-3.5 w-3.5 text-slate-600" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ErrorDetailSheet event={selectedEvent} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
