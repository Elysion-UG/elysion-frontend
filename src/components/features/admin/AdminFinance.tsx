"use client"

import React, { useState, useEffect, useCallback } from "react"
import { DollarSign, Loader2, CreditCard, ArrowDownLeft, Banknote, Wrench } from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminPaymentItem, AdminRefundItem, Settlement, AdminPayoutItem } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import {
  ADMIN_PAYMENT_STATUS_COLOR as paymentStatusColor,
  ADMIN_SETTLEMENT_STATUS_COLOR as settlementStatusColor,
} from "@/src/lib/constants"
import {
  PageHeader,
  RefreshButton,
  LoadingFullPage,
  ADMIN_TH_CLASS,
  ADMIN_THEAD_CLASS,
  ADMIN_TR_CLASS,
} from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"
import { toast } from "sonner"

type Tab = "payments" | "refunds" | "settlements" | "payouts" | "maintenance"

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
      <PageHeader
        title="Finanzen & Wartung"
        subtitle="Zahlungen, Erstattungen, Abrechnungen und System-Wartung"
      />

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
              <RefreshButton onClick={load} />
            </div>
          )}

          {isLoading && tab !== "maintenance" ? (
            <LoadingFullPage />
          ) : (
            <>
              {/* Payments */}
              {tab === "payments" && (
                <div className="overflow-x-auto">
                  {payments.length === 0 ? (
                    <p className="py-8 text-center text-slate-500">Keine Zahlungen gefunden.</p>
                  ) : (
                    <Table>
                      <TableHeader className={ADMIN_THEAD_CLASS}>
                        <TableRow>
                          <TableHead className={ADMIN_TH_CLASS}>ID</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Bestellung</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Betrag</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Datum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.paymentId} className={ADMIN_TR_CLASS}>
                            <TableCell className="px-3 py-2.5 font-mono text-xs text-slate-500">
                              {p.paymentId.slice(0, 12)}…
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-slate-300">
                              {p.orderNumber ?? p.orderId?.slice(0, 8) ?? "–"}
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <StatusBadge
                                label={p.status}
                                colorClasses={
                                  paymentStatusColor[p.status] ?? "bg-slate-800 text-slate-500"
                                }
                              />
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-medium text-slate-200">
                              {formatEuro(p.amount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-slate-500">
                              {new Date(p.createdAt).toLocaleDateString("de-DE")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Refunds */}
              {tab === "refunds" && (
                <div className="overflow-x-auto">
                  {refunds.length === 0 ? (
                    <p className="py-8 text-center text-slate-500">Keine Erstattungen gefunden.</p>
                  ) : (
                    <Table>
                      <TableHeader className={ADMIN_THEAD_CLASS}>
                        <TableRow>
                          <TableHead className={ADMIN_TH_CLASS}>ID</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Payment-ID</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Betrag</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Grund</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Datum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {refunds.map((r) => (
                          <TableRow key={r.refundId} className={ADMIN_TR_CLASS}>
                            <TableCell className="px-3 py-2.5 font-mono text-xs text-slate-500">
                              {r.refundId.slice(0, 12)}…
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-mono text-xs text-slate-500">
                              {r.paymentId.slice(0, 12)}…
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-medium text-slate-200">
                              {formatEuro(r.amount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-slate-500">–</TableCell>
                            <TableCell className="px-3 py-2.5 text-xs text-slate-400">
                              {r.status}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-slate-500">
                              {new Date(r.createdAt).toLocaleDateString("de-DE")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Settlements */}
              {tab === "settlements" && (
                <div className="overflow-x-auto">
                  {settlements.length === 0 ? (
                    <p className="py-8 text-center text-slate-500">Keine Abrechnungen gefunden.</p>
                  ) : (
                    <Table>
                      <TableHeader className={ADMIN_THEAD_CLASS}>
                        <TableRow>
                          <TableHead className={ADMIN_TH_CLASS}>Verkäufer</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Zeitraum</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Brutto</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Gebühr</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Netto</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlements.map((s) => (
                          <TableRow key={s.settlementId} className={ADMIN_TR_CLASS}>
                            <TableCell className="px-3 py-2.5 font-mono text-xs text-slate-500">
                              {s.sellerId.slice(0, 8)}…
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-xs text-slate-400">
                              {s.eligibleAt
                                ? new Date(s.eligibleAt).toLocaleDateString("de-DE")
                                : "–"}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-slate-300">
                              {formatEuro(s.grossAmount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-red-400">
                              -{formatEuro(s.platformFeeAmount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-medium text-emerald-400">
                              {formatEuro(s.netAmount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <StatusBadge
                                label={s.status}
                                colorClasses={
                                  settlementStatusColor[s.status] ?? "bg-slate-800 text-slate-500"
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Payouts */}
              {tab === "payouts" && (
                <div className="overflow-x-auto">
                  {payouts.length === 0 ? (
                    <p className="py-8 text-center text-slate-500">Keine Auszahlungen gefunden.</p>
                  ) : (
                    <Table>
                      <TableHeader className={ADMIN_THEAD_CLASS}>
                        <TableRow>
                          <TableHead className={ADMIN_TH_CLASS}>Verkäufer</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Betrag</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Datum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.map((p) => (
                          <TableRow key={p.payoutId} className={ADMIN_TR_CLASS}>
                            <TableCell className="px-3 py-2.5 text-slate-300">
                              {p.sellerName ?? p.sellerId.slice(0, 8)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-medium text-slate-200">
                              {formatEuro(p.amount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-xs text-slate-400">
                              {p.status}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-slate-500">
                              {new Date(p.createdAt).toLocaleDateString("de-DE")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
