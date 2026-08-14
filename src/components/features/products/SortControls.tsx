"use client"

import { useState } from "react"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/src/components/ui/button"
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
      {/* Auslöser wie der mobile Filter-Trigger daneben: Hairline statt Ink-Kontur. */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="border-border bg-white font-normal [&_svg]:size-3.5"
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        {activeLabel}
      </Button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSortChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary ${
                sortBy === option.value
                  ? "bg-green-50 font-medium text-green-600"
                  : "text-foreground"
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
