"use client"

import { useState } from "react"
import { Sparkles, ChevronDown, ChevronRight, Star, UserCircle, Shirt } from "lucide-react"
import { formatEuro } from "@/src/lib/currency"
import type { Material } from "@/src/types"
import { sustainabilityFilters, importanceScale } from "./shop-constants"

interface FilterSidebarProps {
  isAuthenticated: boolean
  hasValueProfile: boolean
  sustainabilityImportance: Record<string, string>
  onImportanceChange: (attribute: string, importance: string) => void
  priceRange: { min: number; max: number }
  onPriceRangeChange: (range: { min: number; max: number }) => void
  materials: Material[]
  selectedMaterials: string[]
  onToggleMaterial: (slug: string) => void
  onPageReset: () => void
}

export default function FilterSidebar({
  isAuthenticated,
  hasValueProfile,
  sustainabilityImportance,
  onImportanceChange,
  priceRange,
  onPriceRangeChange,
  materials,
  selectedMaterials,
  onToggleMaterial,
  onPageReset,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    sustainability: true,
    categories: false,
  })
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({})
  const [expandedFilterSections, setExpandedFilterSections] = useState({
    price: true,
    materials: true,
  })

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
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-secondary/60 px-4 py-3.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Filter
        </h2>
      </div>

      {/* Nachhaltigkeitspräferenzen */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("sustainability")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm font-medium text-foreground">Nachhaltigkeitspräferenzen</span>
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium text-foreground">
              Bald verfügbar
            </span>
          </div>
          {expandedSections.sustainability ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expandedSections.sustainability && (
          <div className="pointer-events-none space-y-4 px-4 pb-4 opacity-50">
            {isAuthenticated && hasValueProfile ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs text-green-600">
                <UserCircle className="h-3.5 w-3.5" />
                <span>Aus deinem Werteprofil</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
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
                      <Icon className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-sm text-foreground">{filter.label}</span>
                    </div>
                    {expandedFilters[key] ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>

                  {expandedFilters[key] && (
                    <div className="ml-5 rounded-lg bg-green-50/60 p-2.5 text-xs text-muted-foreground">
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
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-green-500"
                    />
                    <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
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
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary"
        >
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm font-medium text-foreground">Preisspanne</span>
          </div>
          {expandedFilterSections.price ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expandedFilterSections.price && (
          <div className="space-y-4 px-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Min (€)</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => handlePriceMinChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
              <span className="mt-5 text-muted-foreground">–</span>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Max (€)</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => handlePriceMaxChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-green-500"
            />
            <p className="text-right text-xs text-muted-foreground">
              bis {formatEuro(priceRange.max)}
            </p>
          </div>
        )}
      </div>

      {/* Material */}
      {materials.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() =>
              setExpandedFilterSections((prev) => ({ ...prev, materials: !prev.materials }))
            }
            className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-2">
              <Shirt className="h-3.5 w-3.5 text-green-600" />
              <span className="text-sm font-medium text-foreground">Material</span>
              {selectedMaterials.length > 0 && (
                <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-600">
                  {selectedMaterials.length}
                </span>
              )}
            </div>
            {expandedFilterSections.materials ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedFilterSections.materials && (
            <ul className="space-y-1 px-4 pb-4">
              {materials.map((material) => (
                <li key={material.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(material.slug)}
                      onChange={() => onToggleMaterial(material.slug)}
                      className="h-4 w-4 rounded border-border text-green-600 focus:ring-green-500"
                    />
                    <span>{material.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
