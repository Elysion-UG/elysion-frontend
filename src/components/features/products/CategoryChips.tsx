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
            ? "border-green-600 bg-green-500 text-ink-900"
            : "border-border bg-white text-foreground hover:border-green-600 hover:bg-green-50 hover:text-green-600"
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
              ? "border-green-600 bg-green-500 text-ink-900"
              : "border-border bg-white text-foreground hover:border-green-600 hover:bg-green-50 hover:text-green-600"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
