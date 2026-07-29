import { Loader2, Wrench } from "lucide-react"
import type { MaintenanceAction } from "@/src/hooks/useAdminFinance"

interface MaintenancePanelProps {
  onRun: (action: MaintenanceAction) => void
  loadingAction: MaintenanceAction | null
}

const JOBS: { action: MaintenanceAction; title: string; description: string }[] = [
  {
    action: "tokens",
    title: "Refresh-Tokens bereinigen",
    description: "Löscht abgelaufene Refresh-Token-Einträge aus der Datenbank.",
  },
  {
    action: "orders",
    title: "Ausstehende Bestellungen ablaufen lassen",
    description: "Markiert überfällige PENDING_PAYMENT-Bestellungen als CANCELLED.",
  },
]

export default function MaintenancePanel({ onRun, loadingAction }: MaintenancePanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-warning/40 bg-warning/20 p-4 text-sm text-warning">
        Wartungs-Jobs werden normalerweise automatisch via Scheduler ausgeführt. Diese Buttons
        ermöglichen eine manuelle Ausführung.
      </div>
      <div className="grid gap-4">
        {JOBS.map((job) => (
          <div key={job.action} className="rounded-lg border border-border/60 bg-ink-900/30 p-5">
            <h3 className="mb-1 font-mono font-semibold text-muted-foreground">{job.title}</h3>
            <p className="mb-3 text-sm text-muted-foreground">{job.description}</p>
            <button
              onClick={() => onRun(job.action)}
              disabled={loadingAction === job.action}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-ink-900/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-green-600/60 hover:text-green-500 disabled:opacity-60"
            >
              {loadingAction === job.action ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wrench className="h-4 w-4" />
              )}
              Ausführen
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
