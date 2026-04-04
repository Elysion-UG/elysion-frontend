"use client"

import { useState, useEffect, useCallback } from "react"
import { Truck, BarChart3, RefreshCw, Loader2, ChevronRight, DollarSign } from "lucide-react"
import { SellerOrderService } from "@/src/services/seller-order.service"
import type { OrderGroupDetail } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"
import { StatusBadge } from "@/src/components/shared"
import { orderStatusLabel, orderStatusColor } from "./sellerDashboard.constants"
import SellerKpiCard from "./SellerKpiCard"
import SellerOrderDetailDrawer from "./SellerOrderDetailDrawer"
import SellerShipModal from "./SellerShipModal"

export default function SellerOrdersTab() {
  const [orders, setOrders] = useState<OrderGroupDetail[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderGroupDetail | null>(null)
  const [shipModalGroupId, setShipModalGroupId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const data = await SellerOrderService.list({ size: 100 })
      setOrders(data.items)
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

  const pendingCount = orders.filter(
    (o) => o.status === "CONFIRMED" || o.status === "PENDING"
  ).length
  const processingCount = orders.filter((o) => o.status === "PROCESSING").length
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0)

  return (
    <>
      {orders.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SellerKpiCard
            label="Neu / Bestätigt"
            value={pendingCount}
            icon={BarChart3}
            color="amber"
          />
          <SellerKpiCard
            label="In Bearbeitung"
            value={processingCount}
            icon={Loader2}
            color="teal"
          />
          <SellerKpiCard label="Versandt" value={shippedCount} icon={Truck} color="slate" />
          <SellerKpiCard
            label="Gesamtumsatz"
            value={formatEuro(totalRevenue)}
            icon={DollarSign}
            color="emerald"
          />
        </div>
      )}
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
                    <StatusBadge
                      label={orderStatusLabel[group.status]}
                      colorClasses={orderStatusColor[group.status]}
                      className="px-2.5 py-1"
                    />
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <SellerOrderDetailDrawer
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
        <SellerShipModal
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
