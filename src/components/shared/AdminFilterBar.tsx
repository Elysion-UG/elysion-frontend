"use client"

import type { ReactNode } from "react"
import { Search, RefreshCw } from "lucide-react"
import { cn } from "@/src/lib/utils"

interface AdminFilterBarProps {
  children: ReactNode
  className?: string
}

export function AdminFilterBar({ children, className }: AdminFilterBarProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-ink-900/60 p-4",
        className
      )}
    >
      {children}
    </div>
  )
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Suchen...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative min-w-48 flex-1", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border/60 bg-ink-900/60 py-2 pl-9 pr-3 text-sm text-muted-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/20"
      />
    </div>
  )
}

interface RefreshButtonProps {
  onClick: () => void
  isLoading?: boolean
  className?: string
}

export function RefreshButton({ onClick, isLoading, className }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-border/60 bg-ink-900/60 px-3 py-2 text-sm text-muted-foreground hover:text-muted-foreground disabled:opacity-50",
        className
      )}
    >
      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Aktualisieren
    </button>
  )
}
