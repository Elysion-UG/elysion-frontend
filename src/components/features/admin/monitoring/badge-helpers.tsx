import type { ErrorSeverity, ErrorCategory } from "@/src/types/error"

const SEVERITY_STYLES: Record<ErrorSeverity, string> = {
  critical: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  high: "bg-orange-900/40 text-orange-400 ring-1 ring-orange-700/40",
  medium: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  low: "bg-slate-800 text-slate-400 ring-1 ring-slate-700/40",
}

const SEVERITY_LABELS: Record<ErrorSeverity, string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
}

const CATEGORY_STYLES: Record<ErrorCategory, string> = {
  api: "bg-blue-900/40 text-blue-400 ring-1 ring-blue-700/40",
  auth: "bg-purple-900/40 text-purple-400 ring-1 ring-purple-700/40",
  render: "bg-pink-900/40 text-pink-400 ring-1 ring-pink-700/40",
  network: "bg-cyan-900/40 text-cyan-400 ring-1 ring-cyan-700/40",
  unknown: "bg-slate-800 text-slate-400 ring-1 ring-slate-700/40",
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
