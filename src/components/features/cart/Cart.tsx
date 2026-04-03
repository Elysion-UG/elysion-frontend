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
        <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
          <PackageOpen className="h-10 w-10 text-stone-300" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-stone-800">Dein Warenkorb ist leer</h2>
          <p className="mt-1 text-sm text-stone-500">Entdecke unsere nachhaltigen Produkte.</p>
        </div>
        <a
          href="/"
          className="rounded-xl bg-sage-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sage-700"
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
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage-100">
          <ShoppingCart className="h-6 w-6 text-sage-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Warenkorb</h1>
          <p className="text-sm text-stone-500">{cart.items.length} Artikel</p>
        </div>
      </div>

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
                className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-sage-50">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-300">
                      <PackageOpen className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {item.productSlug ? (
                    <a
                      href={`/product?slug=${item.productSlug}`}
                      className="block truncate text-sm font-semibold text-stone-800 hover:text-sage-700"
                    >
                      {item.productName ?? "Produkt"}
                    </a>
                  ) : (
                    <span className="block truncate font-semibold text-stone-800">
                      {item.productName ?? "Produkt"}
                    </span>
                  )}
                  {(item.variantOptions?.length ?? 0) > 0 && (
                    <p className="mt-0.5 text-sm text-stone-500">
                      {item.variantOptions?.map((o) => `${o.name}: ${o.value}`).join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-stone-500">{formatEuro(unitPrice)} / Stück</p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      disabled={isItemLoading || item.quantity <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700 disabled:opacity-40"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-stone-800">
                      {isItemLoading ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin text-sage-500" />
                      ) : (
                        item.quantity
                      )}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      disabled={isItemLoading}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700 disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => handleRemove(item.id, item.productName ?? "")}
                    disabled={isItemLoading}
                    className="text-stone-400 transition-colors hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-stone-800">{formatEuro(totalPrice)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-stone-700">Zusammenfassung</h2>
            <div className="space-y-2.5 text-sm text-stone-500">
              <div className="flex justify-between">
                <span>Zwischensumme</span>
                <span className="text-stone-700">{formatEuro(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Versand</span>
                <span className="text-stone-400">wird berechnet</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-stone-100 pt-4 text-base font-bold text-stone-900">
              <span>Gesamt</span>
              <span>{formatEuro(subtotal)}</span>
            </div>
            <a
              href="/checkout"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sage-700"
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
