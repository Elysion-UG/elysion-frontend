"use client"

import { Check, Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

interface AddToCartButtonProps {
  inStock: boolean
  isAdding: boolean
  justAdded: boolean
  onClick: () => void
}

export function AddToCartButton({ inStock, isAdding, justAdded, onClick }: AddToCartButtonProps) {
  const label = isAdding
    ? "Wird hinzugefügt…"
    : justAdded
      ? "Hinzugefügt!"
      : inStock
        ? "In den Warenkorb"
        : "Nicht verfügbar"

  return (
    // Radius, Fokus, Press-Scale und Disabled-Bild kommen aus dem Button-Primitive.
    // Nur die Bestätigungsfläche (justAdded) und die 20-px-Icons bleiben eigen.
    <Button
      size="lg"
      onClick={onClick}
      disabled={!inStock || isAdding}
      className={cn("w-full [&_svg]:size-5", justAdded && "bg-green-600")}
    >
      {isAdding ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : justAdded ? (
        <Check className="h-5 w-5 animate-scale-in" />
      ) : (
        <ShoppingCart className="h-5 w-5" />
      )}
      {label}
    </Button>
  )
}
