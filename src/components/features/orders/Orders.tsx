"use client"

import { useEffect, useState } from "react"
import { Package, ChevronRight, Loader2, PackageOpen } from "lucide-react"
import { OrderService } from "@/src/services/order.service"
import type { Order, OrderStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"

const statusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Zahlung ausstehend",
  PAID: "Bezahlt",
  CONFIRMED: "Bestätigt",
  PROCESSING: "In Bearbeitung",
  SHIPPED: "Versandt",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
  REFUNDED: "Erstattet",
}

const statusColor: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-orange-100 text-orange-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-slate-100 text-slate-600",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    OrderService.list()
      .then(setOrders)
      .catch(() => setError("Bestellungen konnten nicht geladen werden."))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-600">{error}</div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <PackageOpen className="w-16 h-16 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-700">Noch keine Bestellungen</h2>
        <p className="text-slate-500">Deine Bestellungen erscheinen hier.</p>
        <a href="/" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium">
          Zum Shop
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        <Package className="w-8 h-8 text-teal-600" />
        Meine Bestellungen
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <a
            key={order.id}
            href={`/orders/${order.id}`}
            className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800 text-lg">#{order.orderNumber}</p>
                <p className="text-sm text-slate-500 mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[order.status]}`}>
                  {statusLabel[order.status]}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {order.itemCount ? `${order.itemCount} Artikel` : ""}
              </span>
              <span className="font-semibold text-slate-800">{formatEuro(order.total)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
