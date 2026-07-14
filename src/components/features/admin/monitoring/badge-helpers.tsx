import type { ErrorSeverity, ErrorCategory } from "@/src/types/error"

const SEVERITY_STYLES: Record<ErrorSeverity, string> = {
  critical: "bg-destructive/40 text-danger ring-1 ring-danger/40",
  high: "bg-warning/40 text-warning ring-1 ring-warning/40",
  medium: "bg-warning/40 text-warning ring-1 ring-warning/40",
  low: "bg-ink-900 text-muted-foreground ring-1 ring-border/40",
}

const SEVERITY_LABELS: Record<ErrorSeverity, string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
}

const CATEGORY_STYLES: Record<ErrorCategory, string> = {
  api: "bg-info/40 text-info ring-1 ring-info/40",
  auth: "bg-muted/40 text-muted-foreground ring-1 ring-border/40",
  render: "bg-muted/40 text-muted-foreground ring-1 ring-border/40",
  network: "bg-info/40 text-info ring-1 ring-info/40",
  unknown: "bg-ink-900 text-muted-foreground ring-1 ring-border/40",
}

const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  api: "API",
  auth: "Auth",
  render: "Render",
  network: "Netzwerk",
  unknown: "Unbekannt",
}

export function getSeverityBadge(severity: ErrorSeverity) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ${SEVERITY_STYLES[severity]}`}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  )
}

export function getCategoryBadge(category: ErrorCategory) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ${CATEGORY_STYLES[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  )
}
