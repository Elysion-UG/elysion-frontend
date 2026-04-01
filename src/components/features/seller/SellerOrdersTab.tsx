"use client"

import { useState, useEffect, useCallback } from "react"
import { Truck, CheckCircle2, BarChart3, RefreshCw, Loader2, ChevronRight, X } from "lucide-react"
import { SellerOrderService } from "@/src/services/seller-order.service"
import type { OrderGroupDetail } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"
import { orderStatusLabel, orderStatusColor } from "./sellerDashboard.constants"

// ── Order Detail Drawer ──────────────────────────────────────────────────────

function OrderDetailDrawer({
  group,
  onClose,
  onStatusChange,
  onDeliver,
  onShip,
}: {
  group: OrderGroupDetail
  onClose: () => void
  onStatusChange: (groupId: string, status: string) => void
  onDeliver: (groupId: string) => void
  onShip: (groupId: string) => void
}) {
  const formattedDate = new Date(group.createdAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const hasActions =
    group.status === "CONFIRMED" || group.status === "PROCESSING" || group.status === "SHIPPED"

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Bestellung
            </p>
            <h2 className="mt-0.5 font-mono text-sm font-semibold text-slate-800">
              {group.orderId}
            </h2>
            <p className="mt-1 text-xs text-slate-500">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${orderStatusColor[group.status]}`}
            >
              {orderStatusLabel[group.status]}
            </span>
            <button
              onClick={onClose}
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

// ── Ship Modal ──────────────────────────────────────────────────────────────

function ShipModal({
  groupId,
  onClose,
  onDone,
}: {
  groupId: string
  onClose: () => void
  onDone: () => void
}) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Bitte Trackingnummer eingeben.")
      return
    }
    setIsSaving(true)
    try {
      await SellerOrderService.ship(groupId, { trackingNumber, carrier })
      toast.success("Als versandt markiert.")
      onDone()
    } catch {
      toast.error("Fehler beim Versenden.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Versanddetails</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Trackingnummer *
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="z.B. 1Z999AA10123456784"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Versanddienstleister
            </label>
            <input
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="z.B. DHL, UPS, DPD"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Versandt"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Orders Tab ───────────────────────────────────────────────────────────────

export default function SellerOrdersTab() {
  const [orders, setOrders] = useState<OrderGroupDetail[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderGroupDetail | null>(null)
  const [shipModalGroupId, setShipModalGroupId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const data = await SellerOrderService.list({ size: 100 })
      setOrders(data)
    } catch {
      toast.error("Bestellungen konnten nicht geladen werden.")
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleOrderStatus = async (groupId: string, status: string) => {
    try {
      await SellerOrderService.updateStatus(groupId, status)
      toast.success("Status aktualisiert.")
      fetchOrders()
    } catch {
      toast.error("Status konnte nicht geändert werden.")
    }
  }

  const handleDeliver = async (groupId: string) => {
    try {
      await SellerOrderService.deliver(groupId)
      toast.success("Als geliefert markiert.")
      fetchOrders()
    } catch {
      toast.error("Fehler beim Aktualisieren.")
    }
  }

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800">Eingehende Bestellungen</h2>
          <button
            onClick={fetchOrders}
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <RefreshCw className={`h-4 w-4 ${ordersLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">Noch keine Bestellungen.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {orders.map((group) => (
              <button
                key={group.orderGroupId}
                onClick={() => setSelectedOrder(group)}
                className="w-full p-5 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-500">
                      #{group.orderId?.slice(0, 8)}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {group.items?.length ?? 0} Artikel · {formatEuro(group.totalAmount ?? 0)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(group.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${orderStatusColor[group.status]}`}
                    >
                      {orderStatusLabel[group.status]}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailDrawer
          group={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(groupId, status) => {
            handleOrderStatus(groupId, status)
            setSelectedOrder(null)
          }}
          onDeliver={(groupId) => {
            handleDeliver(groupId)
            setSelectedOrder(null)
          }}
          onShip={(groupId) => {
            setShipModalGroupId(groupId)
          }}
        />
      )}

      {shipModalGroupId && (
        <ShipModal
          groupId={shipModalGroupId}
          onClose={() => setShipModalGroupId(null)}
          onDone={() => {
            setShipModalGroupId(null)
            fetchOrders()
          }}
        />
      )}
    </>
  )
}
