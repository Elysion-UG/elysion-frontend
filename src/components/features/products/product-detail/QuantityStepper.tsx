"use client"

import { Minus, Plus } from "lucide-react"

interface QuantityStepperProps {
  quantity: number
  onChange: (quantity: number) => void
  min?: number
  max?: number
}

export function QuantityStepper({ quantity, onChange, min = 1, max }: QuantityStepperProps) {
  const decrement = () => onChange(Math.max(min, quantity - 1))
  const increment = () => onChange(max != null ? Math.min(max, quantity + 1) : quantity + 1)

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-stone-700">Menge</h3>
      <div className="flex items-center gap-3">
        <button
          onClick={decrement}
          aria-label="Menge verringern"
          disabled={quantity <= min}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span
          aria-live="polite"
          aria-label={`Menge: ${quantity}`}
          className="min-w-[2rem] text-center text-base font-bold text-stone-800"
        >
          {quantity}
        </span>
        <button
          onClick={increment}
          aria-label="Menge erhöhen"
          disabled={max != null && quantity >= max}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
