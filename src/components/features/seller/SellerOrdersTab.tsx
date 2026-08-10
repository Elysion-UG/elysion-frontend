"use client"

import { useState } from "react"
import { Truck, BarChart3, RefreshCw, Loader2, ChevronRight, DollarSign } from "lucide-react"
import {
  useSellerOrders,
  useUpdateSellerOrderStatus,
  useDeliverSellerOrder,
  useSellerRefund,
  useSellerSettlements,
} from "@/src/hooks/useSellerDashboard"
import type { OrderGroupDetail } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { remainingRefundable } from "@/src/lib/refund"
import { RefundDialog } from "@/src/components/shared/RefundDialog"
import { hasShippingSla, shippingSlaBadgeLabel } from "@/src/lib/shipping-sla"
import { StatusBadge } from "@/src/components/shared"
import { orderStatusLabel, orderStatusColor, shippingSlaColor } from "./sellerDashboard.constants"
import SellerKpiCard from "./SellerKpiCard"
import SellerOrderDetailDrawer from "./SellerOrderDetailDrawer"
import SellerShipModal from "./SellerShipModal"

export default function SellerOrdersTab() {
  const { data: orders = [], isFetching, refetch } = useSellerOrders()
  const updateStatus = useUpdateSellerOrderStatus()
  const deliver = useDeliverSellerOrder()
  const [selectedOrder, setSelectedOrder] = useState<OrderGroupDetail | null>(null)
  const [shipModalGroupId, setShipModalGroupId] = useState<string | null>(null)
  const [refundGroupId, setRefundGroupId] = useState<string | null>(null)

  // Der erstattbare Restbetrag steht auf der Abrechnungszeile, nicht auf der
  // Bestellung — `GET /api/v1/seller/settlements` ist die einzige Sicht, die
  // `refundedAmount` je OrderGroup führt.
  const { data: settlements = [] } = useSellerSettlements()
  const refund = useSellerRefund()

  const refundStateFor = (orderGroupId: string) => {
    const settlement = settlements.find((s) => s.orderGroupId === orderGroupId)
    if (!settlement) return undefined
    return {
      alreadyRefunded: settlement.refundedAmount ?? 0,
      remaining: remainingRefundable(settlement),
    }
  }

  const refundState = refundGroupId ? refundStateFor(refundGroupId) : undefined

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
      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Eingehende Bestellungen</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Die Versandfrist läuft ab Zahlungseingang und wird vom Server vorgegeben. Überfällige
              Bestellungen sind rot markiert.
            </p>
          </div>
          <button
            onClick={() => void refetch()}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isFetching && orders.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Noch keine Bestellungen.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((group) => {
              const sla = group.shippingSla
              return (
                <button
                  key={group.orderGroupId}
                  onClick={() => setSelectedOrder(group)}
                  className="w-full p-5 text-left transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">
                        #{group.orderId?.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {group.items?.length ?? 0} Artikel · {formatEuro(group.totalAmount ?? 0)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(group.createdAt).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          label={orderStatusLabel[group.status]}
                          colorClasses={orderStatusColor[group.status]}
                          className="px-2.5 py-1"
                        />
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {hasShippingSla(sla) && (
                        <StatusBadge
                          label={shippingSlaBadgeLabel(sla)}
                          colorClasses={shippingSlaColor[sla.status]}
                        />
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <SellerOrderDetailDrawer
          group={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(groupId, status) => {
            updateStatus.mutate({ groupId, status })
            setSelectedOrder(null)
          }}
          onDeliver={(groupId) => {
            deliver.mutate(groupId)
            setSelectedOrder(null)
          }}
          onShip={(groupId) => {
            setShipModalGroupId(groupId)
          }}
          refund={refundStateFor(selectedOrder.orderGroupId)}
          onRefund={(groupId) => {
            setRefundGroupId(groupId)
            setSelectedOrder(null)
          }}
        />
      )}

      {refundGroupId && (
        <RefundDialog
          title="Erstattung auslösen"
          description="Die Erstattung bezieht sich auf diese Bestellung und wird sofort beim Zahlungsdienstleister gebucht."
          orderGroupId={refundGroupId}
          alreadyRefunded={refundState?.alreadyRefunded ?? null}
          remaining={refundState?.remaining ?? null}
          onSubmit={(dto) => refund.mutateAsync(dto)}
          onClose={() => setRefundGroupId(null)}
        />
      )}

      {shipModalGroupId && (
        <SellerShipModal
          groupId={shipModalGroupId}
          onClose={() => setShipModalGroupId(null)}
          onDone={() => {
            setShipModalGroupId(null)
            void refetch()
          }}
        />
      )}
    </>
  )
}
