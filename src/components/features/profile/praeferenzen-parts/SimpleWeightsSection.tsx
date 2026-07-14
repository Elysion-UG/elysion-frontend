"use client"

import { PREFERENCE_CATEGORIES } from "./preferences-constants"

interface SimpleWeightsSectionProps {
  weights: Record<string, number>
  onChange: (categoryId: string, weight: number) => void
}

export function SimpleWeightsSection({ weights, onChange }: SimpleWeightsSectionProps) {
  return (
    <div className="space-y-4">
      {PREFERENCE_CATEGORIES.map((category) => {
        const Icon = category.icon
        return (
          <div key={category.id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <Icon className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-lg font-semibold text-foreground">{category.title}</span>
              <span className="ml-auto text-sm font-bold text-green-600">
                {weights[category.id]}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={weights[category.id]}
              aria-label={`Gewicht für ${category.title}`}
              onChange={(e) => onChange(category.id, Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-green-500"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
