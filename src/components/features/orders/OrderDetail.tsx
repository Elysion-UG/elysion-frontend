"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Package, Truck, CheckCircle2, Loader2, ChevronLeft, MapPin } from "lucide-react"
import { OrderService } from "@/src/services/order.service"
import { ProductService } from "@/src/services/product.service"
import type { OrderDetail as OrderDetailType, OrderStatus, OrderGroupStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toCountryName } from "@/src/lib/country"
import {
  getProductDisplayCache,
  saveProductDisplay,
  type ProductDisplayEntry,
} from "@/src/lib/product-display-cache"

const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Zahlung ausstehend",
  PENDING: "Ausstehend",
  PAID: "Bezahlt",
  CONFIRMED: "Bestätigt",
  PROCESSING: "In Bearbeitung",
  SHIPPED: "Versandt",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
  REFUNDED: "Erstattet",
}

const groupStatusLabel: Record<OrderGroupStatus, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestätigt",
  PROCESSING: "In Bearbeitung",
  SHIPPED: "Versandt",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
}

const groupStatusColor: Record<OrderGroupStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-orange-100 text-orange-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function OrderDetail() {
  const pathname = usePathname()
  const orderId = pathname.split("/orders/")[1]

  const [order, setOrder] = useState<OrderDetailType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayMap, setDisplayMap] =
    useState<Record<string, ProductDisplayEntry>>(getProductDisplayCache)

  useEffect(() => {
    if (!orderId) return
    OrderService.getById(orderId)
      .then(setOrder)
      .catch(() => setError("Bestellung konnte nicht geladen werden."))
      .finally(() => setIsLoading(false))
  }, [orderId])

  // Fetch images for order items whose productId isn't in the display cache.
  // productSnapshot.productSlug is available directly — no product-list lookup needed.
  useEffect(() => {
    if (!order?.groups?.length) return

    const slugsToFetch: Array<{ productId: string; slug: string; name: string }> = []
    for (const group of order.groups ?? []) {
      for (const item of group.items ?? []) {
        const snap = item.productSnapshot
        if (snap?.productId && snap.productSlug && !displayMap[snap.productId]) {
          slugsToFetch.push({
            productId: snap.productId,
            slug: snap.productSlug,
            name: snap.productName ?? snap.productId,
          })
        }
      }
    }

    if (slugsToFetch.length === 0) return

    Promise.all(
      slugsToFetch.map(async ({ productId, slug, name }) => {
        let imageUrl: string | undefined
        try {
          const detail = await ProductService.getBySlug(slug)
          imageUrl = detail.images?.[0]?.url ?? detail.imageUrls?.[0]
        } catch {
          // image fetch failed — show without image
        }
        const entry: ProductDisplayEntry = { name, imageUrl, slug }
        saveProductDisplay(productId, entry)
        return [productId, entry] as const
      })
    )
      .then((entries) => setDisplayMap((prev) => ({ ...prev, ...Object.fromEntries(entries) })))
      .catch(() => {})
  }, [order])

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="py-16 text-center text-red-600">{error ?? "Bestellung nicht gefunden."}</div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <a
        href="/orders"
        className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-teal-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Alle Bestellungen
      </a>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
              <Package className="h-6 w-6 text-teal-600" />#{order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Aufgegeben am {formatDate(order.createdAt ?? "")}
            </p>
          </div>
          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800">
            {order.status ? orderStatusLabel[order.status] : ""}
          </span>
        </div>
      </div>

      {order.shippingAddress && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
            <MapPin className="h-4 w-4 text-teal-600" />
            Lieferadresse
          </h2>
          <address className="text-sm not-italic leading-relaxed text-slate-600">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            <br />
            {order.shippingAddress.street} {order.shippingAddress.houseNumber}
            <br />
            {order.shippingAddress.postalCode} {order.shippingAddress.city}
            <br />
            {toCountryName(order.shippingAddress.country)}
          </address>
        </div>
      )}

      {order.groups?.map((group) => (
        <div key={group.id} className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Verkäufer-Paket</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${groupStatusColor[group.status]}`}
            >
              {groupStatusLabel[group.status]}
            </span>
          </div>

          {group.shipment?.trackingNumber && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <Truck className="h-4 w-4 flex-shrink-0 text-teal-600" />
              <span>
                Tracking: <span className="font-medium">{group.shipment.trackingNumber}</span>
                {group.shipment.carrier && ` via ${group.shipment.carrier}`}
              </span>
            </div>
          )}
          {group.status === "DELIVERED" && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Geliefert
            </div>
          )}

          <div className="space-y-3">
            {group.items?.map((item, idx) => {
              const snap = item.productSnapshot
              const display = snap?.productId ? displayMap[snap.productId] : null
              const name = snap?.productName ?? display?.name ?? "Artikel"
              const imageUrl = display?.imageUrl
              const options = snap?.options ?? []
              return (
                <div key={idx} className="flex gap-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {imageUrl ? (
                      <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{name}</p>
                    {options.length > 0 && (
                      <p className="text-xs text-slate-500">
                        {options.map((o) => `${o.type}: ${o.value}`).join(", ")}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.quantity}× {formatEuro(item.pricePerUnit)}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium text-slate-800">
                    {formatEuro(item.subtotal)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-slate-700">Zusammenfassung</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Zwischensumme</span>
            <span>{formatEuro(order.subtotal ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Versand</span>
            <span>{formatEuro(order.shippingCost ?? 0)}</span>
          </div>
          {order.tax != null && order.tax > 0 && (
            <div className="flex justify-between">
              <span>MwSt.</span>
              <span>{formatEuro(order.tax)}</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 font-bold text-slate-800">
          <span>Gesamt</span>
          <span>{formatEuro(order.total ?? 0)}</span>
        </div>
      </div>
    </div>
  )
}
