"use client"

import { useState } from "react"
import { ArrowUpDown } from "lucide-react"
import { sortOptions } from "./shop-constants"

interface SortControlsProps {
  sortBy: string
  onSortChange: (value: string) => void
}

export default function SortControls({ sortBy, onSortChange }: SortControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? "Sortieren"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50"
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        {activeLabel}
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSortChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-stone-50 ${
                sortBy === option.value ? "bg-sage-50 font-medium text-sage-700" : "text-stone-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
