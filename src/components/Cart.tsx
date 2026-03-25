"use client"

import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Loader2, PackageOpen } from "lucide-react"
import { useCart } from "@/src/context/CartContext"
import { formatEuro, centsToEuro } from "@/src/lib/currency"
import { toast } from "sonner"
import { useState } from "react"

export default function Cart() {
  const { cart, isLoading, updateItem, removeItem } = useCart()
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) return
    setLoadingItemId(itemId)
    try {
      await updateItem(itemId, { quantity: newQty })
    } catch {
      toast.error("Menge konnte nicht geändert werden.")
    } finally {
      setLoadingItemId(null)
    }
  }

  const handleRemove = async (itemId: string, name: string) => {
    setLoadingItemId(itemId)
    try {
      await removeItem(itemId)
      toast.success(`"${name}" entfernt.`)
    } catch {
      toast.error("Artikel konnte nicht entfernt werden.")
    } finally {
      setLoadingItemId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <PackageOpen className="w-16 h-16 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-700">Dein Warenkorb ist leer</h2>
        <p className="text-slate-500">Entdecke unsere nachhaltigen Produkte.</p>
        <a
          href="/"
          className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          Zum Shop
        </a>
      </div>
    )
  }

  const subtotal = cart.subtotalCents != null ? centsToEuro(cart.subtotalCents) : cart.items.reduce((s, i) => s + (i.totalPriceCents != null ? centsToEuro(i.totalPriceCents) : (i as unknown as { totalPrice: number }).totalPrice ?? 0), 0)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        <ShoppingCart className="w-8 h-8 text-teal-600" />
        Warenkorb
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const unitPrice = item.unitPriceCents != null ? centsToEuro(item.unitPriceCents) : (item as unknown as { unitPrice: number }).unitPrice ?? 0
            const totalPrice = item.totalPriceCents != null ? centsToEuro(item.totalPriceCents) : (item as unknown as { totalPrice: number }).totalPrice ?? 0
            const isItemLoading = loadingItemId === item.id

            return (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <PackageOpen className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <a href={`/product?slug=${item.productSlug}`} className="font-semibold text-slate-800 hover:text-teal-700 truncate block">
                    {item.productName}
                  </a>
                  {item.variantOptions.length > 0 && (
                    <p className="text-sm text-slate-500 mt-0.5">
                      {item.variantOptions.map(o => `${o.name}: ${o.value}`).join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-slate-500 mt-1">{formatEuro(unitPrice)} / Stück</p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      disabled={isItemLoading || item.quantity <= 1}
                      className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium text-slate-800">
                      {isItemLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      disabled={isItemLoading}
                      className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Price + remove */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => handleRemove(item.id, item.productName)}
                    disabled={isItemLoading}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-slate-800">{formatEuro(totalPrice)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Zusammenfassung</h2>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Zwischensumme</span>
                <span>{formatEuro(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Versand</span>
                <span className="text-slate-400">wird berechnet</span>
              </div>
            </div>
            <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between font-semibold text-slate-800">
              <span>Gesamt</span>
              <span>{formatEuro(subtotal)}</span>
            </div>
            <a
              href="/checkout"
              className="mt-6 w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              Zur Kasse
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
