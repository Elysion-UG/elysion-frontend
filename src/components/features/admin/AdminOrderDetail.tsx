"use client"

import { useParams } from "next/navigation"
import { Package, Truck, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react"
import { useAdminOrder } from "@/src/hooks/useAdminDetail"
import type { AdminOrderGroup, OrderStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import {
  ADMIN_ORDER_STATUS_LABEL as statusLabel,
  ADMIN_ORDER_GROUP_STATUS_LABEL as groupStatusLabel,
} from "@/src/lib/constants"
import { BackButton, LoadingFullPage, StatusBadge } from "@/src/components/shared"

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
      <div className="flex items-center gap-3 rounded-xl border border-danger/40 bg-destructive/20 px-4 py-3">
        {status === "CANCELLED" ? (
          <XCircle className="h-5 w-5 shrink-0 text-danger" />
        ) : (
          <RotateCcw className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-sm font-medium text-danger">{statusLabel[status]}</span>
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
                      ? "border-green-600 bg-green-500"
                      : active
                        ? "border-green-600 bg-green-500/20"
                        : "border-border bg-ink-900/60"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : active ? (
                    <Clock className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-muted" />
                  )}
                </div>
                <span
                  className={`max-w-[80px] text-center text-xs leading-tight ${
                    active
                      ? "font-semibold text-green-500"
                      : done
                        ? "text-green-500"
                        : "text-foreground"
                  }`}
                >
                  {statusLabel[step]}
                </span>
              </div>
              {/* Connector */}
              {!isLast && (
                <div
                  className={`mx-1 h-0.5 w-10 ${i < currentIndex ? "bg-green-500" : "bg-muted"}`}
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
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-muted-foreground">
          {String(line)}
        </p>
      ))}
    </div>
  )
}

function GroupCard({ group }: { group: AdminOrderGroup }) {
  return (
    <div className="rounded-lg border border-border/60 bg-ink-900/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="font-mono text-xs text-muted-foreground">{group.id.slice(0, 8)}…</span>
        <StatusBadge
          label={groupStatusLabel[group.status] ?? group.status}
          colorClasses={
            group.status === "DELIVERED"
              ? "bg-green-700/40 text-green-500"
              : group.status === "SHIPPED"
                ? "bg-muted/40 text-muted-foreground"
                : group.status === "CANCELLED"
                  ? "bg-destructive/40 text-danger"
                  : "bg-ink-900 text-muted-foreground"
          }
        />
      </div>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Zwischensumme</dt>
          <dd className="text-muted-foreground">{formatEuro(group.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Versand</dt>
          <dd className="text-muted-foreground">{formatEuro(group.shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-border/60 pt-1">
          <dt className="font-medium text-muted-foreground">Gesamt</dt>
          <dd className="font-medium text-muted-foreground">{formatEuro(group.total)}</dd>
        </div>
        {group.carrier && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Versanddienstleister</dt>
            <dd className="text-muted-foreground">{group.carrier}</dd>
          </div>
        )}
        {group.trackingNumber && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Trackingnummer</dt>
            <dd className="font-mono text-xs text-muted-foreground">{group.trackingNumber}</dd>
          </div>
        )}
        {group.shippedAt && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Versandt am</dt>
            <dd className="text-muted-foreground">
              {new Date(group.shippedAt).toLocaleDateString("de-DE")}
            </dd>
          </div>
        )}
        {group.deliveredAt && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Zugestellt am</dt>
            <dd className="text-muted-foreground">
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
  const { data: order, isLoading } = useAdminOrder(id)

  if (isLoading) {
    return <LoadingFullPage />
  }

  if (!order) {
    return <div className="py-20 text-center text-muted-foreground">Bestellung nicht gefunden.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton />

      {/* Header */}
      <div className="rounded-xl border border-border/60 bg-ink-900/60 p-6">
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-xl font-normal text-muted-foreground">
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.guestEmail ?? order.userId ?? "–"} ·{" "}
              {new Date(order.createdAt).toLocaleString("de-DE")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-muted-foreground">{formatEuro(order.total)}</p>
            <p className="text-xs text-muted-foreground">{order.paymentStatus}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <OrderProgress status={order.status} />
        </div>
      </div>

      {/* Financials */}
      <div className="rounded-xl border border-border/60 bg-ink-900/60 p-6">
        <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Kosten
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Zwischensumme</dt>
            <dd className="text-muted-foreground">{formatEuro(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Versand</dt>
            <dd className="text-muted-foreground">{formatEuro(order.shipping)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Steuern</dt>
            <dd className="text-muted-foreground">{formatEuro(order.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-2">
            <dt className="font-semibold text-muted-foreground">Gesamt</dt>
            <dd className="font-semibold text-muted-foreground">{formatEuro(order.total)}</dd>
          </div>
        </dl>
      </div>

      {/* Addresses */}
      {(order.shippingAddress || order.billingAddress) && (
        <div className="grid grid-cols-2 gap-4">
          {order.shippingAddress && (
            <div className="rounded-xl border border-border/60 bg-ink-900/60 p-5">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                  Lieferadresse
                </span>
              </div>
              <AddressBlock label="" address={order.shippingAddress} />
            </div>
          )}
          {order.billingAddress && (
            <div className="rounded-xl border border-border/60 bg-ink-900/60 p-5">
              <div className="mb-3 flex items-center gap-2 text-muted-foreground">
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
        <div className="rounded-xl border border-border/60 bg-ink-900/60 p-6">
          <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
