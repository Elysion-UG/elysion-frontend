"use client"

import { ChevronDown, ChevronRight } from "lucide-react"

interface SectionHeaderProps {
  id: string
  icon: React.ElementType
  label: string
  expanded: boolean
  onToggle: (id: string) => void
}

export function SectionHeader({ id, icon: Icon, label, expanded, onToggle }: SectionHeaderProps) {
  return (
    <button
      onClick={() => onToggle(id)}
      className="flex w-full items-center justify-between p-5 transition-colors hover:bg-stone-50"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-sage-100 p-2">
          <Icon className="h-5 w-5 text-sage-600" />
        </div>
        <span className="text-lg font-semibold text-stone-800">{label}</span>
      </div>
      {expanded ? (
        <ChevronDown className="h-5 w-5 text-stone-400" />
      ) : (
        <ChevronRight className="h-5 w-5 text-stone-400" />
      )}
    </button>
  )
}
