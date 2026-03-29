"use client"

import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Loader2, PackageOpen } from "lucide-react"
import { useCart } from "@/src/context/CartContext"
import { formatEuro, centsToEuro } from "@/src/lib/currency"
import { toast } from "sonner"
import { useState, useEffect } from "react"

export default function Cart() {
  const { cart, isLoading, updateItem, removeItem } = useCart()
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

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

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <PackageOpen className="h-16 w-16 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-700">Dein Warenkorb ist leer</h2>
        <p className="text-slate-500">Entdecke unsere nachhaltigen Produkte.</p>
        <a
          href="/"
          className="rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700"
        >
          Zum Shop
        </a>
      </div>
    )
  }

  // Always computed from unitPrice × quantity so it stays in sync with optimistic
  // quantity updates. cart.subtotalCents/totalPriceCents/lineTotal are backend-sourced
  // and stale until the next server response.
  const subtotal = cart.items.reduce((s, i) => {
    const unitPrice =
      i.unitPriceCents != null
        ? centsToEuro(i.unitPriceCents)
        : (i.priceSnapshot ?? i.unitPrice ?? 0)
    return s + unitPrice * i.quantity
  }, 0)

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 flex items-center gap-3 text-3xl font-bold text-slate-800">
        <ShoppingCart className="h-8 w-8 text-teal-600" />
        Warenkorb
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cart.items.map((item) => {
            const unitPrice =
              item.unitPriceCents != null
                ? centsToEuro(item.unitPriceCents)
                : (item.priceSnapshot ?? item.unitPrice ?? 0)
            // Always derive from unitPrice × quantity so it updates instantly on
            // quantity changes — never use totalPriceCents/lineTotal which are
            // backend-sourced and stale until the next server response.
            const totalPrice = unitPrice * item.quantity
            const isItemLoading = loadingItemId === item.id

            return (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <PackageOpen className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <a
                    href={`/product?slug=${item.productSlug}`}
                    className="block truncate font-semibold text-slate-800 hover:text-teal-700"
                  >
                    {item.productName}
                  </a>
                  {(item.variantOptions?.length ?? 0) > 0 && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {item.variantOptions?.map((o) => `${o.name}: ${o.value}`).join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">{formatEuro(unitPrice)} / Stück</p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      disabled={isItemLoading || item.quantity <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center font-medium text-slate-800">
                      {isItemLoading ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      ) : (
                        item.quantity
                      )}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      disabled={isItemLoading}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => handleRemove(item.id, item.productName ?? "")}
                    disabled={isItemLoading}
                    className="text-slate-400 transition-colors hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-slate-800">{formatEuro(totalPrice)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Zusammenfassung</h2>
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
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 font-semibold text-slate-800">
              <span>Gesamt</span>
              <span>{formatEuro(subtotal)}</span>
            </div>
            <a
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-700"
            >
              Zur Kasse
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
