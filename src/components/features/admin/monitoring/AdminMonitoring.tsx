"use client"

import { useState, useEffect, useCallback } from "react"
import { Trash2 } from "lucide-react"
import { errorStore } from "@/src/lib/error-store"
import type {
  FrontendErrorEvent,
  ErrorSeverity,
  ErrorCategory,
  ErrorStoreStats,
} from "@/src/types/error"
import dynamic from "next/dynamic"
import { Button } from "@/src/components/ui/button"
import HealthSummaryCards from "./HealthSummaryCards"
import ErrorList from "./ErrorList"

const ErrorTrendChart = dynamic(() => import("./ErrorTrendChart"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded bg-muted" />,
})

const TIME_RANGES = [
  { label: "1 Std.", hours: 1 },
  { label: "6 Std.", hours: 6 },
  { label: "24 Std.", hours: 24 },
] as const

export default function AdminMonitoring() {
  const [events, setEvents] = useState<readonly FrontendErrorEvent[]>([])
  const [stats, setStats] = useState<ErrorStoreStats>(() => errorStore.getStats())
  const [hours, setHours] = useState<number>(1)
  const [filterSeverity, setFilterSeverity] = useState<ErrorSeverity | "">("")
  const [filterCategory, setFilterCategory] = useState<ErrorCategory | "">("")

  const refresh = useCallback(() => {
    setEvents(errorStore.getAll())
    setStats(errorStore.getStats())
  }, [])

  // Subscribe to live updates
  useEffect(() => {
    // Initial sync from external error store — required before the subscription fires.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    const unsubscribe = errorStore.subscribe(() => {
      refresh()
    })
    return unsubscribe
  }, [refresh])

  // Also refresh on an interval to keep rate stats accurate
  useEffect(() => {
    const id = setInterval(refresh, 15_000)
    return () => clearInterval(id)
  }, [refresh])

  const handleClear = () => {
    errorStore.clear()
    refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-mono text-xl font-normal tracking-tight text-muted-foreground">
            Monitoring
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Frontend-Fehlerübersicht und Systemstatus
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="border-border bg-ink-900 text-xs text-muted-foreground hover:bg-muted hover:text-muted-foreground [&_svg]:size-3.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Fehler zurücksetzen
        </Button>
      </div>

      {/* Health cards */}
      <HealthSummaryCards stats={stats} />

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Time range */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-ink-900/60 p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.hours}
              onClick={() => setHours(r.hours)}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                hours === r.hours
                  ? "bg-green-700/60 text-green-500 shadow-[inset_0_0_0_1px_rgba(88,178,74,0.25)]"
                  : "text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Severity filter */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as ErrorSeverity | "")}
          className="rounded-lg border border-border bg-ink-900/60 px-3 py-2 font-mono text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="">Alle Schweregrade</option>
          <option value="critical">Kritisch</option>
          <option value="high">Hoch</option>
          <option value="medium">Mittel</option>
          <option value="low">Niedrig</option>
        </select>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ErrorCategory | "")}
          className="rounded-lg border border-border bg-ink-900/60 px-3 py-2 font-mono text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="">Alle Kategorien</option>
          <option value="api">API</option>
          <option value="auth">Auth</option>
          <option value="render">Render</option>
          <option value="network">Netzwerk</option>
          <option value="unknown">Unbekannt</option>
        </select>
      </div>

      {/* Trend chart */}
      <ErrorTrendChart events={events} hours={hours} />

      {/* Error list */}
      <ErrorList events={events} filterSeverity={filterSeverity} filterCategory={filterCategory} />
    </div>
  )
}
