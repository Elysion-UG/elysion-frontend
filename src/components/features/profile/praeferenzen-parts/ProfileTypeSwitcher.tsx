"use client"

import type { ValuesProfileType } from "@/src/types"

interface Option {
  value: ValuesProfileType
  label: string
  desc: string
}

const OPTIONS: Option[] = [
  { value: "none", label: "Kein Profil", desc: "Keine Nachhaltigkeitsfilterung" },
  { value: "simple", label: "Einfach", desc: "Ein Gewicht pro Kategorie" },
  { value: "extended", label: "Erweitert", desc: "Gewichte pro Unterkategorie" },
]

interface ProfileTypeSwitcherProps {
  value: ValuesProfileType
  onChange: (v: ValuesProfileType) => void
}

export function ProfileTypeSwitcher({ value, onChange }: ProfileTypeSwitcherProps) {
  return (
    <div className="mb-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <label className="mb-3 block text-sm font-medium text-stone-700">Profiltyp</label>
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg border-2 p-3 text-left transition-colors ${
              value === opt.value
                ? "border-sage-600 bg-sage-50"
                : "border-stone-200 hover:border-slate-300"
            }`}
            aria-pressed={value === opt.value}
          >
            <span
              className={`block text-sm font-semibold ${
                value === opt.value ? "text-sage-700" : "text-stone-700"
              }`}
            >
              {opt.label}
            </span>
            <span className="mt-0.5 block text-xs text-stone-500">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
