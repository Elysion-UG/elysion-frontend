import { CircleAlert, CircleCheck, Layers } from "lucide-react"
import type { OrderDuplicateStats } from "@/src/types"

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | null
  accent: string
  hint: string
}

function StatCard({ icon: Icon, label, value, accent, hint }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-ink-900/60 p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-widest text-sand-page/50">
          {label}
        </p>
      </div>
      <p className="font-mono text-2xl font-bold tabular-nums text-sand-page">
        {value === null ? "–" : value.toLocaleString("de-DE")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

/** Kacheln über der Review-Liste — Quelle: `GET /api/v1/admin/orders/duplicates/stats`. */
export default function DuplicateStatsCards({ stats }: { stats?: OrderDuplicateStats }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        icon={CircleAlert}
        label="Offen"
        value={stats?.open ?? null}
        accent="bg-warning/20 text-warning"
        hint="Wartet auf eine manuelle Entscheidung"
      />
      <StatCard
        icon={CircleCheck}
        label="Entschieden"
        value={stats?.resolved ?? null}
        accent="bg-green-700/30 text-green-500"
        hint="Entscheidung protokolliert"
      />
      <StatCard
        icon={Layers}
        label="Gesamt"
        value={stats?.total ?? null}
        accent="bg-muted/30 text-muted-foreground"
        hint="Alle je geflaggten Paare"
      />
    </div>
  )
}
