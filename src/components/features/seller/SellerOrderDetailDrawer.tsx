"use client"

import { Truck, CheckCircle2, Clock, AlertTriangle, X, Undo2 } from "lucide-react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import type { OrderGroupDetail } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { hasShippingSla, formatSlaDeadline } from "@/src/lib/shipping-sla"
import { StatusBadge } from "@/src/components/shared"
import {
  orderStatusLabel,
  orderStatusColor,
  shippingSlaLabel,
  shippingSlaColor,
} from "./sellerDashboard.constants"

export interface SellerOrderDetailDrawerProps {
  group: OrderGroupDetail
  onClose: () => void
  onStatusChange: (groupId: string, status: string) => void
  onDeliver: (groupId: string) => void
  onShip: (groupId: string) => void
  /**
   * Erstattungsstand aus der Abrechnungszeile (`GET /api/v1/seller/settlements`).
   * `undefined`, solange die Zeile noch lädt oder es keine gibt — dann bietet
   * der Drawer keine Erstattung an, statt einen Restbetrag zu erfinden.
   */
  refund?: { alreadyRefunded: number; remaining: number }
  onRefund?: (groupId: string) => void
}

export default function SellerOrderDetailDrawer({
  group,
  onClose,
  onStatusChange,
  onDeliver,
  onShip,
  refund,
  onRefund,
}: SellerOrderDetailDrawerProps) {
  const formattedDate = new Date(group.createdAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Erstattung hängt nicht am Bestellstatus, sondern allein am offenen
  // Restbetrag der Abrechnungszeile (§1.4): auch eine gelieferte Bestellung ist
  // erstattbar, eine vollständig erstattete dagegen nicht mehr.
  const canRefund = refund !== undefined && refund.remaining > 0 && onRefund !== undefined

  const hasActions =
    group.status === "CONFIRMED" ||
    group.status === "PROCESSING" ||
    group.status === "SHIPPED" ||
    canRefund

  // Versand-SLA (§1.6 Szenario 1) — reiner Lesezustand vom Server (#143).
  // Es gibt keine Aktion dazu: eine Überschreitung löst man durch Versenden.
  const sla = group.shippingSla
  const slaShipped = sla?.status === "MET" || sla?.status === "MISSED"
  const slaOverdue = sla?.status === "BREACHED" || sla?.status === "MISSED"

  const drawerRef = useFocusTrap(onClose)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink-900/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-drawer-title"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Bestellung
            </p>
            <h2
              id="order-drawer-title"
              className="mt-0.5 font-mono text-sm font-semibold text-foreground"
            >
              {group.orderId}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{formattedDate}</p>
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
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {/* Versand-SLA — Server-Zustand, keine Aktion */}
          {hasShippingSla(sla) && (
            <section
              className={`flex items-start gap-3 rounded-lg px-4 py-3 ${shippingSlaColor[sla.status]}`}
            >
              {slaOverdue ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : slaShipped ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div className="text-sm">
                <p className="font-semibold">{shippingSlaLabel[sla.status]}</p>
                {sla.deadlineAt && (
                  <p className="mt-0.5">
                    {slaShipped
                      ? "Frist war "
                      : slaOverdue
                        ? "Fällig war "
                        : "Bitte versenden bis "}
                    {formatSlaDeadline(sla.deadlineAt)} Uhr.
                  </p>
                )}
                {sla.breachedAt && (
                  <p className="mt-0.5">
                    Eskalation an Sie am {formatSlaDeadline(sla.breachedAt)} Uhr.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Buyer */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Käufer
            </h3>
            <div className="rounded-lg bg-secondary px-4 py-3 text-sm">
              {group.buyer?.guestEmail ? (
                <p className="text-foreground">Gast: {group.buyer.guestEmail}</p>
              ) : (
                <p className="font-mono text-xs text-muted-foreground">
                  {group.buyer?.userId ?? "—"}
                </p>
              )}
            </div>
          </section>

          {/* Shipping address — only shown when backend provides it (CONFIRMED+) */}
          {group.shippingAddress && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lieferadresse
              </h3>
              <div className="rounded-lg bg-secondary px-4 py-3 text-sm text-foreground">
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
              <p className="mt-1.5 text-xs text-muted-foreground">
                Diese Adresse darf ausschließlich für den Versand dieser Bestellung verwendet werden
                (DSGVO Art. 5 Abs. 1 lit. b).
              </p>
            </section>
          )}

          {/* Items */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Artikel ({group.items?.length ?? 0})
            </h3>
            <div className="space-y-2">
              {group.items?.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {item.productSnapshot?.productName ?? "—"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {item.productSnapshot?.options?.map((opt, i) => (
                          <span key={i}>{opt.value}</span>
                        ))}
                        {item.productSnapshot?.sku && (
                          <span className="font-mono">SKU: {item.productSnapshot.sku}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <p className="font-semibold text-foreground">
                        {formatEuro(item.subtotal ?? 0)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
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
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
              <span className="text-sm font-semibold text-green-600">Gesamt</span>
              <span className="text-lg font-bold text-green-600">
                {formatEuro(group.totalAmount)}
              </span>
            </div>
          </section>

          {/* Erstattungen — Stand aus der Abrechnungszeile, nicht nachgerechnet */}
          {refund && refund.alreadyRefunded > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Erstattungen
              </h3>
              <dl className="rounded-lg bg-secondary px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Bereits erstattet</dt>
                  <dd className="font-mono text-foreground">
                    {formatEuro(refund.alreadyRefunded)}
                  </dd>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <dt className="text-muted-foreground">Noch erstattbar</dt>
                  <dd className="font-mono text-foreground">{formatEuro(refund.remaining)}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* Shipment */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Versand
            </h3>
            {group.shipment?.trackingNumber ? (
              <div className="rounded-lg bg-secondary px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-foreground">{group.shipment.trackingNumber}</span>
                  {group.shipment.carrier && (
                    <span className="text-muted-foreground">({group.shipment.carrier})</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Kein Versand erfasst</p>
            )}
          </section>
        </div>

        {/* Footer actions */}
        {hasActions && (
          <div className="border-t border-border p-5">
            <div className="flex flex-wrap gap-2">
              {group.status === "CONFIRMED" && (
                <button
                  onClick={() => {
                    onStatusChange(group.orderGroupId, "PROCESSING")
                    onClose()
                  }}
                  className="flex-1 rounded-lg bg-warning-tint px-4 py-2.5 text-sm font-medium text-warning hover:bg-warning-tint"
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> Als geliefert markieren
                </button>
              )}
              {canRefund && (
                <button
                  onClick={() => onRefund?.(group.orderGroupId)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger-tint"
                >
                  <Undo2 className="h-4 w-4" /> Erstatten
                </button>
              )}
            </div>
            {canRefund && (
              <p className="mt-3 text-xs text-muted-foreground">
                Erstattungen lösen Sie eigenständig aus — eine Freigabe von Elysion ist nicht nötig.
                Die Provision wird anteilig zurückgegeben; die Abrechnungszeile wird bis zur
                Korrektur von der Auszahlung ausgenommen.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
