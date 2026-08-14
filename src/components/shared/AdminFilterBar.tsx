"use client"

import type { ReactNode } from "react"
import { Search, RefreshCw } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
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
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // Ink-Fläche der Filterleiste + Platz für das Lupen-Icon.
        className="h-9 border border-border/60 bg-ink-900/60 pl-9 pr-3 text-sm text-muted-foreground"
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
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isLoading}
      className={cn("border border-border/60 bg-ink-900/60 text-muted-foreground", className)}
    >
      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /> Aktualisieren
    </Button>
  )
}
