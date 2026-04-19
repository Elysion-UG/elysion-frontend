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
          <div
            key={category.id}
            className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-sage-100 p-2">
                <Icon className="h-5 w-5 text-sage-600" />
              </div>
              <span className="text-lg font-semibold text-stone-800">{category.title}</span>
              <span className="ml-auto text-sm font-bold text-sage-600">
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
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200 accent-sage-600"
            />
            <div className="mt-1 flex justify-between text-xs text-stone-400">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
