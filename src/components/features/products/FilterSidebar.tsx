"use client"

import { useState } from "react"
import { Leaf, ChevronDown, ChevronRight, Star, UserCircle } from "lucide-react"
import { formatEuro } from "@/src/lib/currency"
import { sustainabilityFilters, importanceScale } from "./shop-constants"

interface FilterSidebarProps {
  isAuthenticated: boolean
  hasValueProfile: boolean
  sustainabilityImportance: Record<string, string>
  onImportanceChange: (attribute: string, importance: string) => void
  priceRange: { min: number; max: number }
  onPriceRangeChange: (range: { min: number; max: number }) => void
  onPageReset: () => void
}

export default function FilterSidebar({
  isAuthenticated,
  hasValueProfile,
  sustainabilityImportance,
  onImportanceChange,
  priceRange,
  onPriceRangeChange,
  onPageReset,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    sustainability: true,
    categories: false,
  })
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({})
  const [expandedFilterSections, setExpandedFilterSections] = useState({ price: true })

  const toggleSection = (key: "sustainability" | "categories") => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleFilterExpansion = (key: string) => {
    setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getImportanceLabel = (value: string) => {
    return importanceScale.find((scale) => scale.value === value)?.label ?? ""
  }

  const handlePriceMinChange = (value: number) => {
    onPriceRangeChange({ ...priceRange, min: value })
    onPageReset()
  }

  const handlePriceMaxChange = (value: number) => {
    onPriceRangeChange({ ...priceRange, max: value })
    onPageReset()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 bg-stone-50/60 px-4 py-3.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Filter</h2>
      </div>

      {/* Nachhaltigkeitspräferenzen */}
      <div className="border-b border-stone-100">
        <button
          onClick={() => toggleSection("sustainability")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-stone-50"
        >
          <div className="flex items-center gap-2">
            <Leaf className="h-3.5 w-3.5 text-sage-600" />
            <span className="text-sm font-medium text-stone-700">Nachhaltigkeitspräferenzen</span>
            <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-400">
              Bald verfügbar
            </span>
          </div>
          {expandedSections.sustainability ? (
            <ChevronDown className="h-4 w-4 text-stone-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-stone-400" />
          )}
        </button>
        {expandedSections.sustainability && (
          <div className="pointer-events-none space-y-4 px-4 pb-4 opacity-50">
            {isAuthenticated && hasValueProfile ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-sage-50 px-2.5 py-1.5 text-xs text-sage-700">
                <UserCircle className="h-3.5 w-3.5" />
                <span>Aus deinem Werteprofil</span>
              </div>
            ) : (
              <p className="text-xs text-stone-400">
                Wie wichtig ist dir jeder Nachhaltigkeitsaspekt?
              </p>
            )}
            {Object.entries(sustainabilityFilters).map(([key, filter]) => {
              const Icon = filter.icon
              return (
                <div key={key} className="space-y-2">
                  <button
                    onClick={() => toggleFilterExpansion(key)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-sage-600" />
                      <span className="text-sm text-stone-600">{filter.label}</span>
                    </div>
                    {expandedFilters[key] ? (
                      <ChevronDown className="h-3.5 w-3.5 text-stone-300" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
                    )}
                  </button>

                  {expandedFilters[key] && (
                    <div className="ml-5 rounded-lg bg-sage-50/60 p-2.5 text-xs text-stone-500">
                      <ul className="list-inside list-disc space-y-1">
                        {filter.subpoints.map((subpoint, idx) => (
                          <li key={idx}>{subpoint}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="ml-5 flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={sustainabilityImportance[key]}
                      onChange={(e) => onImportanceChange(key, e.target.value)}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-sage-600"
                    />
                    <span className="w-20 shrink-0 text-right text-xs text-stone-400">
                      {getImportanceLabel(sustainabilityImportance[key])}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preisspanne */}
      <div>
        <button
          onClick={() => setExpandedFilterSections((prev) => ({ ...prev, price: !prev.price }))}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-stone-50"
        >
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-sage-600" />
            <span className="text-sm font-medium text-stone-700">Preisspanne</span>
          </div>
          {expandedFilterSections.price ? (
            <ChevronDown className="h-4 w-4 text-stone-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-stone-400" />
          )}
        </button>
        {expandedFilterSections.price && (
          <div className="space-y-4 px-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-stone-400">Min (€)</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => handlePriceMinChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100"
                  placeholder="0"
                />
              </div>
              <span className="mt-5 text-stone-300">–</span>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-stone-400">Max (€)</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => handlePriceMaxChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100"
                  placeholder="300"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              value={priceRange.max}
              onChange={(e) => handlePriceMaxChange(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-sage-600"
            />
            <p className="text-right text-xs text-stone-400">bis {formatEuro(priceRange.max)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
