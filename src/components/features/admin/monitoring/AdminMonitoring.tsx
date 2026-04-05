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
import HealthSummaryCards from "./HealthSummaryCards"
import ErrorList from "./ErrorList"

const ErrorTrendChart = dynamic(
  () => import("./ErrorTrendChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse rounded bg-muted" />
    ),
  }
)

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
          <h1 className="font-mono text-xl font-bold tracking-tight text-slate-100">Monitoring</h1>
          <p className="mt-1 text-sm text-slate-500">Frontend-Fehlerübersicht und Systemstatus</p>
        </div>
        <button
          onClick={handleClear}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Fehler zurücksetzen
        </button>
      </div>

      {/* Health cards */}
      <HealthSummaryCards stats={stats} />

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Time range */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.hours}
              onClick={() => setHours(r.hours)}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                hours === r.hours
                  ? "bg-cyber-900/60 text-cyber-300 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.2)]"
                  : "text-slate-500 hover:text-slate-300"
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
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyber-600"
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
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyber-600"
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
