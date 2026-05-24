import { Skeleton } from "@/src/components/ui/skeleton"

export type RouteLoadingTheme = "light" | "dark"

export interface RouteLoadingFallbackProps {
  theme?: RouteLoadingTheme
  /** Optional title above the skeleton block, e.g. "Bestellungen werden geladen". */
  label?: string
}

export function RouteLoadingFallback({ theme = "light", label }: RouteLoadingFallbackProps) {
  const isDark = theme === "dark"
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto flex min-h-[40vh] w-full max-w-5xl flex-col gap-4 px-4 py-8"
    >
      {label ? (
        <span className={`sr-only`}>{label}</span>
      ) : (
        <span className="sr-only">Wird geladen…</span>
      )}
      <Skeleton className={`h-7 w-48 ${isDark ? "bg-slate-800" : ""}`} />
      <Skeleton className={`h-4 w-72 ${isDark ? "bg-slate-800" : ""}`} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className={`h-40 w-full ${isDark ? "bg-slate-800" : ""}`} />
        <Skeleton className={`h-40 w-full ${isDark ? "bg-slate-800" : ""}`} />
        <Skeleton className={`h-40 w-full ${isDark ? "bg-slate-800" : ""}`} />
      </div>
    </div>
  )
}
