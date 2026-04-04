"use client"

import { Truck, CheckCircle2, X } from "lucide-react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import type { OrderGroupDetail } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { StatusBadge } from "@/src/components/shared"
import { orderStatusLabel, orderStatusColor } from "./sellerDashboard.constants"

export interface SellerOrderDetailDrawerProps {
  group: OrderGroupDetail
  onClose: () => void
  onStatusChange: (groupId: string, status: string) => void
  onDeliver: (groupId: string) => void
  onShip: (groupId: string) => void
}

export default function SellerOrderDetailDrawer({
  group,
  onClose,
  onStatusChange,
  onDeliver,
  onShip,
}: SellerOrderDetailDrawerProps) {
  const formattedDate = new Date(group.createdAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const hasActions =
    group.status === "CONFIRMED" || group.status === "PROCESSING" || group.status === "SHIPPED"

  const drawerRef = useFocusTrap(onClose)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-drawer-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Bestellung
            </p>
            <h2
              id="order-drawer-title"
              className="mt-0.5 font-mono text-sm font-semibold text-slate-800"
            >
              {group.orderId}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge
              label={orderStatusLabel[group.status]}
              colorClasses={orderStatusColor[group.status]}
              className="px-3 py-1"
            />
            <button
              onClick={onClose}
              aria-label="Schliessen"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {/* Buyer */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Käufer
            </h3>
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
              {group.buyer?.guestEmail ? (
                <p className="text-slate-700">Gast: {group.buyer.guestEmail}</p>
              ) : (
                <p className="font-mono text-xs text-slate-500">{group.buyer?.userId ?? "—"}</p>
              )}
            </div>
          </section>

          {/* Shipping address — only shown when backend provides it (CONFIRMED+) */}
          {group.shippingAddress && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Lieferadresse
              </h3>
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium">
                  {group.shippingAddress.firstName} {group.shippingAddress.lastName}
                </p>
                <p>
                  {group.shippingAddress.street} {group.shippingAddress.houseNumber}
                </p>
                <p>
                  {group.shippingAddress.postalCode} {group.shippingAddress.city}
                </p>
                <p>{group.shippingAddress.country}</p>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Diese Adresse darf ausschließlich für den Versand dieser Bestellung verwendet werden
                (DSGVO Art. 5 Abs. 1 lit. b).
              </p>
            </section>
          )}

          {/* Items */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Artikel ({group.items?.length ?? 0})
            </h3>
            <div className="space-y-2">
              {group.items?.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">
                        {item.productSnapshot?.productName ?? "—"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        {item.productSnapshot?.options?.map((opt, i) => (
                          <span key={i}>{opt.value}</span>
                        ))}
                        {item.productSnapshot?.sku && (
                          <span className="font-mono">SKU: {item.productSnapshot.sku}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <p className="font-semibold text-slate-800">
                        {formatEuro(item.subtotal ?? 0)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.quantity}× {formatEuro(item.pricePerUnit ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Total */}
          <section>
            <div className="flex items-center justify-between rounded-lg bg-teal-50 px-4 py-3">
              <span className="text-sm font-semibold text-teal-800">Gesamt</span>
              <span className="text-lg font-bold text-teal-700">
                {formatEuro(group.totalAmount)}
              </span>
            </div>
          </section>

          {/* Shipment */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Versand
            </h3>
            {group.shipment?.trackingNumber ? (
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-slate-500" />
                  <span className="font-mono text-slate-700">{group.shipment.trackingNumber}</span>
                  {group.shipment.carrier && (
                    <span className="text-slate-500">({group.shipment.carrier})</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Kein Versand erfasst</p>
            )}
          </section>
        </div>

        {/* Footer actions */}
        {hasActions && (
          <div className="border-t border-slate-200 p-5">
            <div className="flex flex-wrap gap-2">
              {group.status === "CONFIRMED" && (
                <button
                  onClick={() => {
                    onStatusChange(group.orderGroupId, "PROCESSING")
                    onClose()
                  }}
                  className="flex-1 rounded-lg bg-orange-100 px-4 py-2.5 text-sm font-medium text-orange-800 hover:bg-orange-200"
                >
                  In Bearbeitung setzen
                </button>
              )}
              {group.status === "PROCESSING" && (
                <button
                  onClick={() => {
                    onShip(group.orderGroupId)
                    onClose()
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-100 px-4 py-2.5 text-sm font-medium text-purple-800 hover:bg-purple-200"
                >
                  <Truck className="h-4 w-4" /> Versenden
                </button>
              )}
              {group.status === "SHIPPED" && (
                <button
                  onClick={() => {
                    onDeliver(group.orderGroupId)
                    onClose()
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-100 px-4 py-2.5 text-sm font-medium text-green-800 hover:bg-green-200"
                >
                  <CheckCircle2 className="h-4 w-4" /> Als geliefert markieren
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
