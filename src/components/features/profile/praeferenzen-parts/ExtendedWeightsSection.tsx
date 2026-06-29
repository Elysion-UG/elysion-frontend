"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { PREFERENCE_CATEGORIES } from "./preferences-constants"

interface ExtendedWeightsSectionProps {
  weights: Record<string, Record<string, number>>
  onChange: (categoryId: string, subId: string, weight: number) => void
}

export function ExtendedWeightsSection({ weights, onChange }: ExtendedWeightsSectionProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-4">
      {PREFERENCE_CATEGORIES.map((category) => {
        const Icon = category.icon
        const isExpanded = expanded[category.id]
        const catWeights = weights[category.id]
        const avg = Math.round(
          Object.values(catWeights).reduce((s, v) => s + v, 0) / Object.values(catWeights).length
        )

        return (
          <div
            key={category.id}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            <button
              onClick={() => toggle(category.id)}
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-between p-5 transition-colors hover:bg-stone-50"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sage-100 p-2">
                  <Icon className="h-5 w-5 text-sage-600" />
                </div>
                <span className="text-lg font-semibold text-stone-800">{category.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-sage-600">Gesamt: {avg}%</span>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-stone-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-stone-400" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-5 px-5 pb-5">
                <div className="flex h-3 overflow-hidden rounded-full bg-stone-200">
                  {category.subs.map((sub, i) => (
                    <div
                      key={sub.id}
                      className={`transition-all duration-300 ${
                        i === 0 ? "bg-sage-500" : i === 1 ? "bg-sage-300" : "bg-sage-200"
                      }`}
                      style={{ width: `${catWeights[sub.id] / category.subs.length}%` }}
                    />
                  ))}
                </div>

                {category.subs.map((sub, i) => (
                  <div key={sub.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`pref-${category.id}-${sub.id}`}
                        className="flex-1 pr-4 text-sm font-medium text-stone-700"
                      >
                        {sub.label}
                      </label>
                      <span
                        className={`w-12 text-right text-sm font-bold ${
                          i === 0 ? "text-sage-600" : "text-teal-400"
                        }`}
                      >
                        {catWeights[sub.id]}%
                      </span>
                    </div>
                    <input
                      id={`pref-${category.id}-${sub.id}`}
                      type="range"
                      min="0"
                      max="100"
                      value={catWeights[sub.id]}
                      onChange={(e) => onChange(category.id, sub.id, Number(e.target.value))}
                      className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200 ${
                        i === 0 ? "accent-sage-600" : "accent-sage-300"
                      }`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
