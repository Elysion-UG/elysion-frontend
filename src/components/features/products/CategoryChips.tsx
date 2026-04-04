"use client"

import { categoryChips } from "./shop-constants"

interface CategoryChipsProps {
  activeSearch: string
  onSelectCategory: (query: string) => void
  onReset: () => void
}

export default function CategoryChips({
  activeSearch,
  onSelectCategory,
  onReset,
}: CategoryChipsProps) {
  return (
    <div className="scrollbar-hide mb-8 flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={onReset}
        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
          !activeSearch
            ? "border-sage-300 bg-sage-600 text-white"
            : "border-stone-200 bg-white text-stone-600 hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700"
        }`}
      >
        Alle
      </button>
      {categoryChips.map(({ label, icon: Icon, query }) => (
        <button
          key={label}
          onClick={() => onSelectCategory(query)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
            activeSearch === query
              ? "border-sage-300 bg-sage-600 text-white"
              : "border-stone-200 bg-white text-stone-600 hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
