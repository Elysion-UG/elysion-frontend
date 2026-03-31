"use client"

import { Package, ChevronRight, Loader2, PackageOpen } from "lucide-react"
import Link from "next/link"
import type { OrderStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { useOrders } from "@/src/hooks/useOrders"

const statusLabel: Record<OrderStatus, string> = {
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

const statusColor: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-orange-100 text-orange-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-slate-100 text-slate-600",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function OrdersSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <Package className="h-8 w-8 text-teal-600" />
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="mt-3 flex justify-end">
              <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Orders() {
  const { data: orders, isLoading, error } = useOrders()

  if (isLoading) {
    return <OrdersSkeleton />
  }

  if (error) {
    return (
      <div className="py-16 text-center text-red-600">
        Bestellungen konnten nicht geladen werden.
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <PackageOpen className="h-16 w-16 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-700">Noch keine Bestellungen</h2>
        <p className="text-slate-500">Deine Bestellungen erscheinen hier.</p>
        <Link
          href="/"
          className="rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700"
        >
          Zum Shop
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 flex items-center gap-3 text-3xl font-bold text-slate-800">
        <Package className="h-8 w-8 text-teal-600" />
        Meine Bestellungen
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-teal-300 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-slate-800">#{order.orderNumber}</p>
                <p className="mt-0.5 text-sm text-slate-500">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[order.status]}`}
                >
                  {statusLabel[order.status]}
                </span>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <div className="mt-3 flex justify-end text-sm">
              <span className="font-semibold text-slate-800">{formatEuro(order.total ?? 0)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
