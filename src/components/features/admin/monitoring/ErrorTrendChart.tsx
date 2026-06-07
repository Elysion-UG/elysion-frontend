"use client"

import { useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { FrontendErrorEvent, ErrorSeverity } from "@/src/types/error"

interface ErrorTrendChartProps {
  events: readonly FrontendErrorEvent[]
  /** Time range in hours. */
  hours: number
}

const SEVERITY_COLORS: Record<ErrorSeverity, string> = {
  critical: "#f87171",
  high: "#fb923c",
  medium: "#facc15",
  low: "#94a3b8",
}

function bucketEvents(
  events: readonly FrontendErrorEvent[],
  hours: number
): { time: string; critical: number; high: number; medium: number; low: number }[] {
  const now = Date.now()
  const cutoff = now - hours * 60 * 60 * 1000
  // Use 5-min buckets for <=1h, otherwise 1h buckets
  const bucketMs = hours <= 1 ? 5 * 60 * 1000 : 60 * 60 * 1000
  const bucketCount = Math.ceil((hours * 60 * 60 * 1000) / bucketMs)

  // Initialize empty buckets
  const buckets: { time: string; critical: number; high: number; medium: number; low: number }[] =
    []
  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = cutoff + i * bucketMs
    const d = new Date(bucketStart)
    const label =
      hours <= 1
        ? d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    buckets.push({ time: label, critical: 0, high: 0, medium: 0, low: 0 })
  }

  // Fill buckets
  for (const event of events) {
    const ts = new Date(event.timestamp).getTime()
    if (ts < cutoff) continue
    const idx = Math.min(Math.floor((ts - cutoff) / bucketMs), bucketCount - 1)
    buckets[idx][event.severity]++
  }

  return buckets
}

export default function ErrorTrendChart({ events, hours }: ErrorTrendChartProps) {
  const data = useMemo(() => bucketEvents(events, hours), [events, hours])

  if (events.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-sm text-slate-500">Keine Fehler im ausgewählten Zeitraum.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
        Fehlerverlauf ({hours <= 1 ? "5-Min-Intervalle" : "Stunden-Intervalle"})
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="time"
            stroke="#475569"
            tick={{ fontSize: 11, fill: "#64748b" }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#475569" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
          <Line
            type="monotone"
            dataKey="critical"
            name="Kritisch"
            stroke={SEVERITY_COLORS.critical}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="high"
            name="Hoch"
            stroke={SEVERITY_COLORS.high}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="medium"
            name="Mittel"
            stroke={SEVERITY_COLORS.medium}
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="low"
            name="Niedrig"
            stroke={SEVERITY_COLORS.low}
            strokeWidth={1}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
