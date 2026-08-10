"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/src/components/ui/button"

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
      <h3 className="mb-3 text-sm font-semibold text-foreground">Menge</h3>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={decrement}
          aria-label="Menge verringern"
          disabled={quantity <= min}
          className="h-9 w-9 rounded-full border border-border text-muted-foreground hover:border-green-600 hover:bg-green-50 hover:text-green-600 [&_svg]:size-3.5"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span
          aria-live="polite"
          aria-label={`Menge: ${quantity}`}
          className="min-w-[2rem] text-center text-base font-bold text-foreground"
        >
          {quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={increment}
          aria-label="Menge erhöhen"
          disabled={max != null && quantity >= max}
          className="h-9 w-9 rounded-full border border-border text-muted-foreground hover:border-green-600 hover:bg-green-50 hover:text-green-600 [&_svg]:size-3.5"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
