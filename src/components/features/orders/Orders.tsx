"use client"

import { Package, ChevronRight, PackageOpen } from "lucide-react"
import Link from "next/link"
import { formatEuro } from "@/src/lib/currency"
import {
  BUYER_ORDER_STATUS_LABEL as statusLabel,
  BUYER_ORDER_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import { StatusBadge } from "@/src/components/shared"
import { useOrders } from "@/src/hooks/useOrders"

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
      <div className="mb-8 flex items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-green-50" />
        <div className="space-y-2">
          <div className="h-6 w-44 animate-pulse rounded bg-muted" />
          <div className="h-3 w-28 animate-pulse rounded bg-secondary" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
              </div>
              <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="mt-3 flex justify-end">
              <div className="h-4 w-16 animate-pulse rounded bg-secondary" />
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
      <div className="py-16 text-center text-danger">
        Bestellungen konnten nicht geladen werden.
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <PackageOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Noch keine Bestellungen</h2>
          <p className="mt-1 text-sm text-muted-foreground">Deine Bestellungen erscheinen hier.</p>
        </div>
        <Link
          href="/"
          className="rounded-xl bg-green-500 px-6 py-2.5 text-sm font-semibold text-ink-900 shadow-sm transition-colors hover:bg-green-700"
        >
          Zum Shop
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50">
          <Package className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-normal text-foreground">Meine Bestellungen</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} Bestellung{orders.length !== 1 ? "en" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="group block rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-green-600 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-foreground">#{order.orderNumber}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  label={statusLabel[order.status]}
                  colorClasses={statusColor[order.status]}
                  className="px-2.5 py-1"
                />
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-green-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-xs text-muted-foreground">Gesamtbetrag</span>
              <span className="font-bold text-foreground">{formatEuro(order.total ?? 0)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
