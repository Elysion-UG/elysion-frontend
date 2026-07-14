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
      bg: "bg-green-700/40",
      text: "text-green-500",
      ring: "ring-green-500/40",
      dot: "bg-green-500",
    },
    yellow: {
      label: "Erhöht",
      bg: "bg-warning/40",
      text: "text-warning",
      ring: "ring-warning/40",
      dot: "bg-warning",
    },
    red: {
      label: "Kritisch",
      bg: "bg-destructive/40",
      text: "text-danger",
      ring: "ring-danger/40",
      dot: "bg-destructive",
    },
  }

  const status = statusConfig[statusLevel]

  const cards = [
    {
      label: "Fehler (gesamt)",
      value: stats.total,
      icon: AlertTriangle,
      accent: "text-muted-foreground",
      iconColor: "text-muted-foreground",
    },
    {
      label: "Kritische Fehler",
      value: stats.bySeverity.critical,
      icon: Shield,
      accent: stats.bySeverity.critical > 0 ? "text-danger" : "text-muted-foreground",
      iconColor: stats.bySeverity.critical > 0 ? "text-danger" : "text-muted-foreground",
    },
    {
      label: "Fehler / Minute",
      value: stats.errorsPerMinute,
      icon: TrendingUp,
      accent: "text-muted-foreground",
      iconColor: "text-muted-foreground",
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
        <div key={card.label} className="rounded-xl border border-border bg-ink-900/60 p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
