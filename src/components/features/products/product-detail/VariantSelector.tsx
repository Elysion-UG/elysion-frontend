"use client"

import type { ProductVariant } from "@/src/types"

interface VariantSelectorProps {
  variants: ProductVariant[] | undefined
  selectedVariant: ProductVariant | null
  onSelect: (variant: ProductVariant) => void
}

// Extracts unique option types and values from variants.
// Variants expose options either as { type, value } pairs or as direct
// size/color fields; we normalize both into a single option map.
function collectOptionTypes(variants: ProductVariant[]): Record<string, string[]> {
  const optionTypes: Record<string, string[]> = {}
  variants.forEach((v) => {
    v.options?.forEach((opt) => {
      if (!optionTypes[opt.type]) optionTypes[opt.type] = []
      if (!optionTypes[opt.type].includes(opt.value)) {
        optionTypes[opt.type].push(opt.value)
      }
    })
    if (v.size && !optionTypes["Größe"]?.includes(v.size)) {
      optionTypes["Größe"] = [...(optionTypes["Größe"] ?? []), v.size]
    }
    if (v.color && !optionTypes["Farbe"]?.includes(v.color)) {
      optionTypes["Farbe"] = [...(optionTypes["Farbe"] ?? []), v.color]
    }
  })
  return optionTypes
}

function collectSelectedValues(variant: ProductVariant | null): Record<string, string> {
  const values: Record<string, string> = {}
  variant?.options?.forEach((opt) => {
    values[opt.type] = opt.value
  })
  if (variant?.size) values["Größe"] = variant.size
  if (variant?.color) values["Farbe"] = variant.color
  return values
}

export function VariantSelector({ variants, selectedVariant, onSelect }: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null

  const optionTypes = collectOptionTypes(variants)
  const selectedValues = collectSelectedValues(selectedVariant)

  const handleSelect = (type: string, value: string) => {
    const match = variants.find((v) => {
      const byOption = v.options?.some((o) => o.type === type && o.value === value)
      const bySize = type === "Größe" && v.size === value
      const byColor = type === "Farbe" && v.color === value
      return byOption || bySize || byColor
    })
    if (match) onSelect(match)
  }

  return (
    <>
      {Object.entries(optionTypes).map(([type, values]) => (
        <div key={type}>
          <h3 className="mb-3 text-lg font-semibold text-stone-800">{type}</h3>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => (
              <button
                key={value}
                onClick={() => handleSelect(type, value)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedValues[type] === value
                    ? "border-sage-600 bg-sage-600 text-white shadow-sm"
                    : "border-stone-200 text-stone-700 hover:border-sage-400 hover:bg-sage-50"
                }`}
                aria-pressed={selectedValues[type] === value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
