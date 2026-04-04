"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminOrderDetail, AdminOrderGroup, OrderStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import {
  ADMIN_ORDER_STATUS_LABEL as statusLabel,
  ADMIN_ORDER_GROUP_STATUS_LABEL as groupStatusLabel,
} from "@/src/lib/constants"
import { toast } from "sonner"

// Ordered steps for the progress track (excludes terminal states CANCELLED/REFUNDED)
const ORDER_STEPS: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PENDING",
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
]

function OrderProgress({ status }: { status: OrderStatus }) {
  const isTerminal = status === "CANCELLED" || status === "REFUNDED"
  const currentIndex = ORDER_STEPS.indexOf(status)

  if (isTerminal) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-800/40 bg-red-900/20 px-4 py-3">
        {status === "CANCELLED" ? (
          <XCircle className="h-5 w-5 shrink-0 text-red-400" />
        ) : (
          <RotateCcw className="h-5 w-5 shrink-0 text-slate-400" />
        )}
        <span className="text-sm font-medium text-red-400">{statusLabel[status]}</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center gap-0">
        {ORDER_STEPS.map((step, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          const isLast = i === ORDER_STEPS.length - 1

          return (
            <div key={step} className="flex items-center">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    done
                      ? "border-emerald-500 bg-emerald-500"
                      : active
                        ? "border-cyber-500 bg-cyber-500/20"
                        : "border-slate-700 bg-slate-800/60"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : active ? (
                    <Clock className="h-4 w-4 text-cyber-400" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-slate-600" />
                  )}
                </div>
                <span
                  className={`max-w-[80px] text-center text-xs leading-tight ${
                    active
                      ? "font-semibold text-cyber-400"
                      : done
                        ? "text-emerald-400"
                        : "text-slate-600"
                  }`}
                >
                  {statusLabel[step]}
                </span>
              </div>
              {/* Connector */}
              {!isLast && (
                <div
                  className={`mx-1 h-0.5 w-10 ${i < currentIndex ? "bg-emerald-500" : "bg-slate-700"}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AddressBlock({ label, address }: { label: string; address: Record<string, unknown> }) {
  const fields = ["name", "street", "addressLine2", "city", "postalCode", "country"]
  const lines = fields.map((f) => address[f]).filter(Boolean)
  if (lines.length === 0) return null
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-slate-300">
          {String(line)}
        </p>
      ))}
    </div>
  )
}

function GroupCard({ group }: { group: AdminOrderGroup }) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-800/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="font-mono text-xs text-slate-500">{group.id.slice(0, 8)}…</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            group.status === "DELIVERED"
              ? "bg-emerald-900/40 text-emerald-400"
              : group.status === "SHIPPED"
                ? "bg-purple-900/40 text-purple-400"
                : group.status === "CANCELLED"
                  ? "bg-red-900/40 text-red-400"
                  : "bg-slate-800 text-slate-400"
          }`}
        >
          {groupStatusLabel[group.status] ?? group.status}
        </span>
      </div>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Zwischensumme</dt>
          <dd className="text-slate-200">{formatEuro(group.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Versand</dt>
          <dd className="text-slate-200">{formatEuro(group.shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-slate-700/60 pt-1">
          <dt className="font-medium text-slate-400">Gesamt</dt>
          <dd className="font-medium text-slate-100">{formatEuro(group.total)}</dd>
        </div>
        {group.carrier && (
          <div className="flex justify-between">
            <dt className="text-slate-500">Versanddienstleister</dt>
            <dd className="text-slate-300">{group.carrier}</dd>
          </div>
        )}
        {group.trackingNumber && (
          <div className="flex justify-between">
            <dt className="text-slate-500">Trackingnummer</dt>
            <dd className="font-mono text-xs text-slate-300">{group.trackingNumber}</dd>
          </div>
        )}
        {group.shippedAt && (
          <div className="flex justify-between">
            <dt className="text-slate-500">Versandt am</dt>
            <dd className="text-slate-300">
              {new Date(group.shippedAt).toLocaleDateString("de-DE")}
            </dd>
          </div>
        )}
        {group.deliveredAt && (
          <div className="flex justify-between">
            <dt className="text-slate-500">Zugestellt am</dt>
            <dd className="text-slate-300">
              {new Date(group.deliveredAt).toLocaleDateString("de-DE")}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export default function AdminOrderDetailView() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await AdminService.getOrder(id)
      setOrder(data)
    } catch {
      toast.error("Bestellung konnte nicht geladen werden.")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
      </div>
    )
  }

  if (!order) {
    return <div className="py-20 text-center text-slate-500">Bestellung nicht gefunden.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück
      </button>

      {/* Header */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-xl font-bold text-slate-100">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {order.guestEmail ?? order.userId ?? "–"} ·{" "}
              {new Date(order.createdAt).toLocaleString("de-DE")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-100">{formatEuro(order.total)}</p>
            <p className="text-xs text-slate-500">{order.paymentStatus}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <OrderProgress status={order.status} />
        </div>
      </div>

      {/* Financials */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
        <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
          Kosten
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Zwischensumme</dt>
            <dd className="text-slate-200">{formatEuro(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Versand</dt>
            <dd className="text-slate-200">{formatEuro(order.shipping)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Steuern</dt>
            <dd className="text-slate-200">{formatEuro(order.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-700/60 pt-2">
            <dt className="font-semibold text-slate-300">Gesamt</dt>
            <dd className="font-semibold text-slate-100">{formatEuro(order.total)}</dd>
          </div>
        </dl>
      </div>

      {/* Addresses */}
      {(order.shippingAddress || order.billingAddress) && (
        <div className="grid grid-cols-2 gap-4">
          {order.shippingAddress && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-400">
                <Truck className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                  Lieferadresse
                </span>
              </div>
              <AddressBlock label="" address={order.shippingAddress} />
            </div>
          )}
          {order.billingAddress && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-400">
                <Package className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                  Rechnungsadresse
                </span>
              </div>
              <AddressBlock label="" address={order.billingAddress} />
            </div>
          )}
        </div>
      )}

      {/* Order Groups */}
      {order.orderGroups?.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
            Seller-Gruppen ({order.orderGroups.length})
          </h2>
          <div className="space-y-3">
            {order.orderGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
