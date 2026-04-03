"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  DollarSign,
  RefreshCw,
  Loader2,
  CreditCard,
  ArrowDownLeft,
  Banknote,
  Wrench,
} from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminPaymentItem, AdminRefundItem, Settlement, AdminPayoutItem } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"

type Tab = "payments" | "refunds" | "settlements" | "payouts" | "maintenance"

const paymentStatusColor: Record<string, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  SUCCEEDED: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  FAILED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  REFUNDED: "bg-slate-800 text-slate-500",
}

const settlementStatusColor: Record<string, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  PROCESSING: "bg-blue-900/40 text-blue-400 ring-1 ring-blue-700/40",
  PAID: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  FAILED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
}

export default function AdminFinance() {
  const [tab, setTab] = useState<Tab>("payments")

  const [payments, setPayments] = useState<AdminPaymentItem[]>([])
  const [refunds, setRefunds] = useState<AdminRefundItem[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [payouts, setPayouts] = useState<AdminPayoutItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [maintenanceLoading, setMaintenanceLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      if (tab === "payments") {
        const res = await AdminService.listPayments({ page: 0, size: 50 })
        setPayments(res.items ?? [])
      } else if (tab === "refunds") {
        const res = await AdminService.listRefunds({ page: 0, size: 50 })
        setRefunds(res.items ?? [])
      } else if (tab === "settlements") {
        const res = await AdminService.listSettlements({ page: 0, size: 50 })
        setSettlements(res.items ?? [])
      } else if (tab === "payouts") {
        const res = await AdminService.listPayouts({ page: 0, size: 50 })
        setPayouts(res.items ?? [])
      }
    } catch {
      toast.error("Fehler beim Laden.")
    } finally {
      setIsLoading(false)
    }
  }, [tab])

  useEffect(() => {
    if (tab !== "maintenance") load()
  }, [load, tab])

  const runMaintenance = async (action: "tokens" | "orders") => {
    setMaintenanceLoading(action)
    try {
      if (action === "tokens") {
        await AdminService.cleanupRefreshTokens()
        toast.success("Refresh-Token-Bereinigung abgeschlossen.")
      } else {
        await AdminService.expirePendingOrders()
        toast.success("Ausstehende Bestellungen abgelaufen.")
      }
    } catch {
      toast.error("Fehler beim Ausführen.")
    } finally {
      setMaintenanceLoading(null)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "payments", label: "Zahlungen", icon: <CreditCard className="h-4 w-4" /> },
    { id: "refunds", label: "Erstattungen", icon: <ArrowDownLeft className="h-4 w-4" /> },
    { id: "settlements", label: "Abrechnungen", icon: <DollarSign className="h-4 w-4" /> },
    { id: "payouts", label: "Auszahlungen", icon: <Banknote className="h-4 w-4" /> },
    { id: "maintenance", label: "Wartung", icon: <Wrench className="h-4 w-4" /> },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-slate-100">
          Finanzen & Wartung
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Zahlungen, Erstattungen, Abrechnungen und System-Wartung
        </p>
      </div>

      {/* Tabs */}
      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/60">
        <div className="flex overflow-x-auto border-b border-slate-800/60">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-b-2 border-cyber-500 bg-cyber-950/30 text-cyber-400"
                  : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab !== "maintenance" && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={load}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                <RefreshCw className="h-4 w-4" /> Aktualisieren
              </button>
            </div>
          )}

          {isLoading && tab !== "maintenance" ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
            </div>
          ) : (
            <>
              {/* Payments */}
              {tab === "payments" && (
                <div className="overflow-x-auto">
                  {payments.length === 0 ? (
                    <p className="py-8 text-center text-slate-500">Keine Zahlungen gefunden.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-800/60 bg-slate-800/30">
                        <tr>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            ID
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Bestellung
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Betrag
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Datum
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {payments.map((p) => (
                          <tr key={p.paymentId} className="transition-colors hover:bg-slate-800/30">
                            <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                              {p.paymentId.slice(0, 12)}…
                            </td>
                            <td className="px-3 py-2.5 text-slate-300">
                              {p.orderNumber ?? p.orderId?.slice(0, 8) ?? "–"}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${paymentStatusColor[p.status] ?? "bg-slate-800 text-slate-500"}`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-medium text-slate-200">
                              {formatEuro(p.amount)}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500">
                              {new Date(p.createdAt).toLocaleDateString("de-DE")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Refunds */}
              {tab === "refunds" && (
                <div className="overflow-x-auto">
                  {refunds.length === 0 ? (
                    <p className="py-8 text-center text-slate-500">Keine Erstattungen gefunden.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-800/60 bg-slate-800/30">
                        <tr>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            ID
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Payment-ID
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Betrag
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Grund
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Datum
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {refunds.map((r) => (
                          <tr key={r.refundId} className="transition-colors hover:bg-slate-800/30">
                            <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                              {r.refundId.slice(0, 12)}…
                            </td>
                            <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                              {r.paymentId.slice(0, 12)}…
                            </td>
                            <td className="px-3 py-2.5 font-medium text-slate-200">
                              {formatEuro(r.amount)}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500">–</td>
                            <td className="px-3 py-2.5 text-xs text-slate-400">{r.status}</td>
                            <td className="px-3 py-2.5 text-slate-500">
                              {new Date(r.createdAt).toLocaleDateString("de-DE")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Settlements */}
              {tab === "settlements" && (
                <div className="overflow-x-auto">
                  {settlements.length === 0 ? (
                    <p className="py-8 text-center text-slate-500">Keine Abrechnungen gefunden.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-800/60 bg-slate-800/30">
                        <tr>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Verkäufer
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Zeitraum
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Brutto
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Gebühr
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Netto
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {settlements.map((s) => (
                          <tr
                            key={s.settlementId}
                            className="transition-colors hover:bg-slate-800/30"
                          >
                            <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                              {s.sellerId.slice(0, 8)}…
                            </td>
                            <td className="px-3 py-2.5 text-xs text-slate-400">
                              {s.eligibleAt
                                ? new Date(s.eligibleAt).toLocaleDateString("de-DE")
                                : "–"}
                            </td>
                            <td className="px-3 py-2.5 text-slate-300">
                              {formatEuro(s.grossAmount)}
                            </td>
                            <td className="px-3 py-2.5 text-red-400">
                              -{formatEuro(s.platformFeeAmount)}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-emerald-400">
                              {formatEuro(s.netAmount)}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${settlementStatusColor[s.status] ?? "bg-slate-800 text-slate-500"}`}
                              >
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Payouts */}
              {tab === "payouts" && (
                <div className="overflow-x-auto">
                  {payouts.length === 0 ? (
                    <p className="py-8 text-center text-slate-500">Keine Auszahlungen gefunden.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-800/60 bg-slate-800/30">
                        <tr>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Verkäufer
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Betrag
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                            Datum
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {payouts.map((p) => (
                          <tr key={p.payoutId} className="transition-colors hover:bg-slate-800/30">
                            <td className="px-3 py-2.5 text-slate-300">
                              {p.sellerName ?? p.sellerId.slice(0, 8)}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-slate-200">
                              {formatEuro(p.amount)}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-slate-400">{p.status}</td>
                            <td className="px-3 py-2.5 text-slate-500">
                              {new Date(p.createdAt).toLocaleDateString("de-DE")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Maintenance */}
              {tab === "maintenance" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-800/40 bg-amber-900/20 p-4 text-sm text-amber-400">
                    Wartungs-Jobs werden normalerweise automatisch via Scheduler ausgeführt. Diese
                    Buttons ermöglichen eine manuelle Ausführung.
                  </div>
                  <div className="grid gap-4">
                    <div className="rounded-lg border border-slate-800/60 bg-slate-800/30 p-5">
                      <h3 className="mb-1 font-mono font-semibold text-slate-200">
                        Refresh-Tokens bereinigen
                      </h3>
                      <p className="mb-3 text-sm text-slate-500">
                        Löscht abgelaufene Refresh-Token-Einträge aus der Datenbank.
                      </p>
                      <button
                        onClick={() => runMaintenance("tokens")}
                        disabled={maintenanceLoading === "tokens"}
                        className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-300 hover:border-cyber-700/60 hover:text-cyber-400 disabled:opacity-60"
                      >
                        {maintenanceLoading === "tokens" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wrench className="h-4 w-4" />
                        )}
                        Ausführen
                      </button>
                    </div>
                    <div className="rounded-lg border border-slate-800/60 bg-slate-800/30 p-5">
                      <h3 className="mb-1 font-mono font-semibold text-slate-200">
                        Ausstehende Bestellungen ablaufen lassen
                      </h3>
                      <p className="mb-3 text-sm text-slate-500">
                        Markiert überfällige PENDING_PAYMENT-Bestellungen als CANCELLED.
                      </p>
                      <button
                        onClick={() => runMaintenance("orders")}
                        disabled={maintenanceLoading === "orders"}
                        className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-300 hover:border-cyber-700/60 hover:text-cyber-400 disabled:opacity-60"
                      >
                        {maintenanceLoading === "orders" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wrench className="h-4 w-4" />
                        )}
                        Ausführen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
