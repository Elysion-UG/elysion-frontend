"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Package, Truck, CheckCircle2, Loader2, ChevronLeft, MapPin } from "lucide-react"
import { OrderService } from "@/src/services/order.service"
import type { OrderDetail as OrderDetailType, OrderStatus, OrderGroupStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"

const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Zahlung ausstehend",
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
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function OrderDetail() {
  const pathname = usePathname()
  const orderId = pathname.split("/orders/")[1]

  const [order, setOrder] = useState<OrderDetailType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    OrderService.getById(orderId)
      .then(setOrder)
      .catch(() => setError("Bestellung konnte nicht geladen werden."))
      .finally(() => setIsLoading(false))
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return <div className="text-center py-16 text-red-600">{error ?? "Bestellung nicht gefunden."}</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <a href="/orders" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-700 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Alle Bestellungen
      </a>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-6 h-6 text-teal-600" />
              #{order.orderNumber}
            </h1>
            <p className="text-sm text-slate-500 mt-1">Aufgegeben am {formatDate(order.createdAt)}</p>
          </div>
          <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {orderStatusLabel[order.status]}
          </span>
        </div>
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-teal-600" />
            Lieferadresse
          </h2>
          <address className="not-italic text-slate-600 text-sm leading-relaxed">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
            {order.shippingAddress.street} {order.shippingAddress.houseNumber}<br />
            {order.shippingAddress.postalCode} {order.shippingAddress.city}<br />
            {order.shippingAddress.country}
          </address>
        </div>
      )}

      {/* Order groups */}
      {order.groups?.map((group) => (
        <div key={group.id} className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">Verkäufer-Paket</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${groupStatusColor[group.status]}`}>
              {groupStatusLabel[group.status]}
            </span>
          </div>

          {/* Tracking info */}
          {group.shipment?.trackingNumber && (
            <div className="bg-slate-50 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-slate-600">
              <Truck className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>
                Tracking: <span className="font-medium">{group.shipment.trackingNumber}</span>
                {group.shipment.carrier && ` via ${group.shipment.carrier}`}
              </span>
            </div>
          )}
          {group.status === "DELIVERED" && (
            <div className="bg-green-50 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Geliefert
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            {group.items?.map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="w-14 h-14 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{item.productName}</p>
                  {item.variantOptions?.length > 0 && (
                    <p className="text-xs text-slate-500">{item.variantOptions.map(o => `${o.name}: ${o.value}`).join(", ")}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">{item.quantity}× {formatEuro(item.unitPriceCents / 100)}</p>
                </div>
                <span className="font-medium text-slate-800 text-sm whitespace-nowrap">
                  {formatEuro(item.totalPriceCents / 100)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Total breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Zusammenfassung</h2>
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
        <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between font-bold text-slate-800">
          <span>Gesamt</span>
          <span>{formatEuro(order.total ?? 0)}</span>
        </div>
      </div>
    </div>
  )
}
