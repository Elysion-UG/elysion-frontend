"use client"

import React, { useState, useEffect, useCallback } from "react"
import { DollarSign, RefreshCw, Loader2, CreditCard, ArrowDownLeft, Banknote, Wrench } from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminPaymentItem, AdminRefundItem, Settlement, AdminPayoutItem } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"

type Tab = "payments" | "refunds" | "settlements" | "payouts" | "maintenance"

const paymentStatusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SUCCEEDED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-600",
}

const settlementStatusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
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
    } catch { toast.error("Fehler beim Laden.") }
    finally { setIsLoading(false) }
  }, [tab])

  useEffect(() => { if (tab !== "maintenance") load() }, [load, tab])

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
    } catch { toast.error("Fehler beim Ausführen.") }
    finally { setMaintenanceLoading(null) }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "payments", label: "Zahlungen", icon: <CreditCard className="w-4 h-4" /> },
    { id: "refunds", label: "Erstattungen", icon: <ArrowDownLeft className="w-4 h-4" /> },
    { id: "settlements", label: "Abrechnungen", icon: <DollarSign className="w-4 h-4" /> },
    { id: "payouts", label: "Auszahlungen", icon: <Banknote className="w-4 h-4" /> },
    { id: "maintenance", label: "Wartung", icon: <Wrench className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Finanzen & Wartung</h1>
          <p className="text-slate-500 text-sm mt-1">Zahlungen, Erstattungen, Abrechnungen und System-Wartung</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "border-b-2 border-teal-600 text-teal-600 bg-teal-50"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab !== "maintenance" && (
              <div className="flex justify-end mb-4">
                <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-2">
                  <RefreshCw className="w-4 h-4" /> Aktualisieren
                </button>
              </div>
            )}

            {isLoading && tab !== "maintenance" ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
            ) : (
              <>
                {/* Payments */}
                {tab === "payments" && (
                  <div className="overflow-x-auto">
                    {payments.length === 0 ? <p className="text-center text-slate-500 py-8">Keine Zahlungen gefunden.</p> : (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">ID</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Bestellung</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Status</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Betrag</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Datum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{p.id.slice(0, 12)}…</td>
                              <td className="px-3 py-2.5 text-slate-700">{p.orderNumber ?? p.orderId.slice(0, 8)}</td>
                              <td className="px-3 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusColor[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 font-medium text-slate-800">{formatEuro(p.amountCents / 100)}</td>
                              <td className="px-3 py-2.5 text-slate-500">{new Date(p.createdAt).toLocaleDateString("de-DE")}</td>
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
                    {refunds.length === 0 ? <p className="text-center text-slate-500 py-8">Keine Erstattungen gefunden.</p> : (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">ID</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Payment-ID</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Betrag</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Grund</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Status</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Datum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {refunds.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{r.id.slice(0, 12)}…</td>
                              <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{r.paymentId.slice(0, 12)}…</td>
                              <td className="px-3 py-2.5 font-medium text-slate-800">{formatEuro(r.amountCents / 100)}</td>
                              <td className="px-3 py-2.5 text-slate-500">{r.reason ?? "–"}</td>
                              <td className="px-3 py-2.5 text-xs text-slate-600">{r.status}</td>
                              <td className="px-3 py-2.5 text-slate-500">{new Date(r.createdAt).toLocaleDateString("de-DE")}</td>
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
                    {settlements.length === 0 ? <p className="text-center text-slate-500 py-8">Keine Abrechnungen gefunden.</p> : (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Verkäufer</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Zeitraum</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Brutto</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Gebühr</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Netto</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {settlements.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{s.sellerId.slice(0, 8)}…</td>
                              <td className="px-3 py-2.5 text-slate-600 text-xs">
                                {new Date(s.periodStart).toLocaleDateString("de-DE")} – {new Date(s.periodEnd).toLocaleDateString("de-DE")}
                              </td>
                              <td className="px-3 py-2.5 text-slate-700">{formatEuro(s.grossAmountCents / 100)}</td>
                              <td className="px-3 py-2.5 text-red-600">-{formatEuro(s.platformFeeCents / 100)}</td>
                              <td className="px-3 py-2.5 font-medium text-emerald-700">{formatEuro(s.netAmountCents / 100)}</td>
                              <td className="px-3 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${settlementStatusColor[s.status] ?? "bg-slate-100 text-slate-600"}`}>
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
                    {payouts.length === 0 ? <p className="text-center text-slate-500 py-8">Keine Auszahlungen gefunden.</p> : (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Verkäufer</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Betrag</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Status</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-600">Datum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payouts.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2.5 text-slate-700">{p.sellerName ?? p.sellerId.slice(0, 8)}</td>
                              <td className="px-3 py-2.5 font-medium text-slate-800">{formatEuro(p.amountCents / 100)}</td>
                              <td className="px-3 py-2.5 text-xs text-slate-600">{p.status}</td>
                              <td className="px-3 py-2.5 text-slate-500">{new Date(p.createdAt).toLocaleDateString("de-DE")}</td>
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
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                      Wartungs-Jobs werden normalerweise automatisch via Scheduler ausgeführt. Diese Buttons ermöglichen eine manuelle Ausführung.
                    </div>
                    <div className="grid gap-4">
                      <div className="border border-slate-200 rounded-lg p-5">
                        <h3 className="font-semibold text-slate-800 mb-1">Refresh-Tokens bereinigen</h3>
                        <p className="text-sm text-slate-500 mb-3">Löscht abgelaufene Refresh-Token-Einträge aus der Datenbank.</p>
                        <button
                          onClick={() => runMaintenance("tokens")}
                          disabled={maintenanceLoading === "tokens"}
                          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-60 flex items-center gap-2"
                        >
                          {maintenanceLoading === "tokens" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                          Ausführen
                        </button>
                      </div>
                      <div className="border border-slate-200 rounded-lg p-5">
                        <h3 className="font-semibold text-slate-800 mb-1">Ausstehende Bestellungen ablaufen lassen</h3>
                        <p className="text-sm text-slate-500 mb-3">Markiert überfällige PENDING_PAYMENT-Bestellungen als CANCELLED.</p>
                        <button
                          onClick={() => runMaintenance("orders")}
                          disabled={maintenanceLoading === "orders"}
                          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-60 flex items-center gap-2"
                        >
                          {maintenanceLoading === "orders" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
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
    </div>
  )
}
