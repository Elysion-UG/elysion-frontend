"use client"

import { CreditCard } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

interface PaymentMethodsSectionProps {
  expanded: boolean
  onToggle: (id: string) => void
}

export function PaymentMethodsSection({ expanded, onToggle }: PaymentMethodsSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <SectionHeader
        id="payment"
        icon={CreditCard}
        label="Zahlungsmethoden"
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <div className="space-y-3 px-5 pb-5">
          <div className="rounded-lg border border-dashed border-border bg-secondary p-4 text-center">
            <p className="text-sm font-medium text-foreground">
              Gespeicherte Zahlungsmethoden folgen in Kürze
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Aktuell werden Zahlungen pro Bestellung im Checkout ausgewählt.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
