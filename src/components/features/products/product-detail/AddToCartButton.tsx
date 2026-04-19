"use client"

import { Check, Loader2, ShoppingCart } from "lucide-react"

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
    <button
      onClick={onClick}
      disabled={!inStock || isAdding}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-300 ${
        justAdded ? "bg-green-600 hover:bg-green-700" : "bg-sage-600 hover:bg-sage-700"
      }`}
    >
      {isAdding ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : justAdded ? (
        <Check className="h-5 w-5 animate-scale-in" />
      ) : (
        <ShoppingCart className="h-5 w-5" />
      )}
      {label}
    </button>
  )
}
