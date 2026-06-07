"use client"

import { AlertTriangle, Activity, TrendingUp, Shield } from "lucide-react"
import type { ErrorStoreStats } from "@/src/types/error"

interface HealthSummaryCardsProps {
  stats: ErrorStoreStats
}

export default function HealthSummaryCards({ stats }: HealthSummaryCardsProps) {
  const statusLevel =
    stats.errorsPerMinute >= 5 ? "red" : stats.errorsPerMinute >= 1 ? "yellow" : "green"

  const statusConfig = {
    green: {
      label: "Gesund",
      bg: "bg-emerald-900/40",
      text: "text-emerald-400",
      ring: "ring-emerald-700/40",
      dot: "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]",
    },
    yellow: {
      label: "Erhöht",
      bg: "bg-yellow-900/40",
      text: "text-yellow-400",
      ring: "ring-yellow-700/40",
      dot: "bg-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.8)]",
    },
    red: {
      label: "Kritisch",
      bg: "bg-red-900/40",
      text: "text-red-400",
      ring: "ring-red-700/40",
      dot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]",
    },
  }

  const status = statusConfig[statusLevel]

  const cards = [
    {
      label: "Fehler (gesamt)",
      value: stats.total,
      icon: AlertTriangle,
      accent: "text-slate-300",
      iconColor: "text-slate-500",
    },
    {
      label: "Kritische Fehler",
      value: stats.bySeverity.critical,
      icon: Shield,
      accent: stats.bySeverity.critical > 0 ? "text-red-400" : "text-slate-300",
      iconColor: stats.bySeverity.critical > 0 ? "text-red-500" : "text-slate-500",
    },
    {
      label: "Fehler / Minute",
      value: stats.errorsPerMinute,
      icon: TrendingUp,
      accent: "text-slate-300",
      iconColor: "text-slate-500",
    },
    {
      label: "Systemstatus",
      value: status.label,
      icon: Activity,
      accent: status.text,
      iconColor: status.text,
      dot: status.dot,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {card.label}
            </p>
            <card.icon className={`h-4 w-4 ${card.iconColor}`} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {card.dot && <span className={`h-2 w-2 rounded-full ${card.dot}`} />}
            <p className={`font-mono text-2xl font-bold ${card.accent}`}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
