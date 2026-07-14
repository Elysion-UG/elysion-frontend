"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useEffectEvent } from "@/src/hooks/use-effect-event"
import {
  DollarSign,
  Loader2,
  CreditCard,
  ArrowDownLeft,
  Banknote,
  Wrench,
  HandCoins,
  Send,
} from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type {
  AdminPaymentItem,
  AdminRefundItem,
  Settlement,
  AdminPayoutItem,
  PayoutDueItem,
} from "@/src/types"
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

type Tab = "payments" | "refunds" | "settlements" | "due" | "payouts" | "maintenance"

export default function AdminFinance() {
  const [tab, setTab] = useState<Tab>("payments")

  const [payments, setPayments] = useState<AdminPaymentItem[]>([])
  const [refunds, setRefunds] = useState<AdminRefundItem[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [duePayouts, setDuePayouts] = useState<PayoutDueItem[]>([])
  const [payouts, setPayouts] = useState<AdminPayoutItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [releasingSellerId, setReleasingSellerId] = useState<string | null>(null)
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
      } else if (tab === "due") {
        const items = await AdminService.listDuePayouts()
        setDuePayouts(items ?? [])
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

  const releasePayout = async (item: PayoutDueItem) => {
    setReleasingSellerId(item.sellerId)
    try {
      await AdminService.runPayout(item.sellerId)
      toast.success(`Auszahlung für ${item.sellerName} freigegeben.`)
      setDuePayouts((prev) => prev.filter((d) => d.sellerId !== item.sellerId))
    } catch {
      toast.error("Auszahlung konnte nicht freigegeben werden.")
    } finally {
      setReleasingSellerId(null)
    }
  }

  const runEffect = useEffectEvent(() => {
    if (tab !== "maintenance") void load()
  })
  useEffect(() => {
    runEffect()
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
    { id: "due", label: "Fällige Auszahlungen", icon: <HandCoins className="h-4 w-4" /> },
    { id: "payouts", label: "Auszahlungen", icon: <Banknote className="h-4 w-4" /> },
    { id: "maintenance", label: "Wartung", icon: <Wrench className="h-4 w-4" /> },
  ]

  return (
    <div>
      <PageHeader
        title="Finanzen & Wartung"
        subtitle="Zahlungen, Erstattungen, Abrechnungen und System-Wartung"
      />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-ink-900/60">
        <div className="flex overflow-x-auto border-b border-border/60">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-b-2 border-green-600 bg-green-700/30 text-green-500"
                  : "text-muted-foreground hover:bg-ink-900/40 hover:text-muted-foreground"
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
                    <p className="py-8 text-center text-muted-foreground">
                      Keine Zahlungen gefunden.
                    </p>
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
                            <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                              {p.paymentId.slice(0, 12)}…
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-muted-foreground">
                              {p.orderNumber ?? p.orderId?.slice(0, 8) ?? "–"}
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <StatusBadge
                                label={p.status}
                                colorClasses={
                                  paymentStatusColor[p.status] ?? "bg-ink-900 text-muted-foreground"
                                }
                              />
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-medium text-muted-foreground">
                              {formatEuro(p.amount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-muted-foreground">
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
                    <p className="py-8 text-center text-muted-foreground">
                      Keine Erstattungen gefunden.
                    </p>
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
                            <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                              {r.refundId.slice(0, 12)}…
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                              {r.paymentId.slice(0, 12)}…
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-medium text-muted-foreground">
                              {formatEuro(r.amount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-muted-foreground">–</TableCell>
                            <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                              {r.status}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-muted-foreground">
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
                    <p className="py-8 text-center text-muted-foreground">
                      Keine Abrechnungen gefunden.
                    </p>
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
                            <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                              {s.sellerId.slice(0, 8)}…
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                              {s.eligibleAt
                                ? new Date(s.eligibleAt).toLocaleDateString("de-DE")
                                : "–"}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-muted-foreground">
                              {formatEuro(s.grossAmount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-danger">
                              -{formatEuro(s.platformFeeAmount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-medium text-green-500">
                              {formatEuro(s.netAmount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <StatusBadge
                                label={s.status}
                                colorClasses={
                                  settlementStatusColor[s.status] ??
                                  "bg-ink-900 text-muted-foreground"
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

              {/* Fällige Auszahlungen */}
              {tab === "due" && (
                <div className="overflow-x-auto">
                  <div className="mb-4 rounded-lg border border-border/60 bg-ink-900/30 p-4 text-sm text-muted-foreground">
                    Auszahlungen werden <span className="text-muted-foreground">monatlich</span>{" "}
                    manuell freigegeben. Aufgeführt sind pro Verkäufer alle gelieferten, noch nicht
                    ausgezahlten Abrechnungen. Eine Freigabe ist nur bei aktivem
                    Stripe-Auszahlungskonto möglich.
                  </div>
                  {duePayouts.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      Keine fälligen Auszahlungen.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader className={ADMIN_THEAD_CLASS}>
                        <TableRow>
                          <TableHead className={ADMIN_TH_CLASS}>Verkäufer</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Konto</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Abrechnungen</TableHead>
                          <TableHead className={ADMIN_TH_CLASS}>Netto</TableHead>
                          <TableHead className={ADMIN_TH_CLASS} />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {duePayouts.map((d) => {
                          const canRelease = d.payoutAccountStatus === "ACTIVE"
                          return (
                            <TableRow key={d.sellerId} className={ADMIN_TR_CLASS}>
                              <TableCell className="px-3 py-2.5 text-muted-foreground">
                                {d.sellerName}
                              </TableCell>
                              <TableCell className="px-3 py-2.5">
                                <StatusBadge
                                  label={d.payoutAccountStatus}
                                  colorClasses={
                                    canRelease
                                      ? "bg-green-700/40 text-green-500 ring-1 ring-green-500/40"
                                      : "bg-warning/40 text-warning ring-1 ring-warning/40"
                                  }
                                />
                              </TableCell>
                              <TableCell className="px-3 py-2.5 text-muted-foreground">
                                {d.settlementCount}
                              </TableCell>
                              <TableCell className="px-3 py-2.5 font-medium text-green-500">
                                {formatEuro(d.netAmount)}
                              </TableCell>
                              <TableCell className="px-3 py-2.5 text-right">
                                <button
                                  onClick={() => void releasePayout(d)}
                                  disabled={!canRelease || releasingSellerId === d.sellerId}
                                  title={
                                    canRelease
                                      ? "Auszahlung freigeben"
                                      : "Verkäufer hat kein aktives Auszahlungskonto"
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-green-600/60 bg-green-700/30 px-3 py-1.5 text-xs text-green-500 hover:text-green-500 disabled:opacity-40"
                                >
                                  {releasingSellerId === d.sellerId ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Send className="h-3.5 w-3.5" />
                                  )}
                                  Freigeben
                                </button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Payouts */}
              {tab === "payouts" && (
                <div className="overflow-x-auto">
                  {payouts.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                      Keine Auszahlungen gefunden.
                    </p>
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
                            <TableCell className="px-3 py-2.5 text-muted-foreground">
                              {p.sellerName ?? p.sellerId.slice(0, 8)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 font-medium text-muted-foreground">
                              {formatEuro(p.amount)}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                              {p.status}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-muted-foreground">
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
                  <div className="rounded-lg border border-warning/40 bg-warning/20 p-4 text-sm text-warning">
                    Wartungs-Jobs werden normalerweise automatisch via Scheduler ausgeführt. Diese
                    Buttons ermöglichen eine manuelle Ausführung.
                  </div>
                  <div className="grid gap-4">
                    <div className="rounded-lg border border-border/60 bg-ink-900/30 p-5">
                      <h3 className="mb-1 font-mono font-semibold text-muted-foreground">
                        Refresh-Tokens bereinigen
                      </h3>
                      <p className="mb-3 text-sm text-muted-foreground">
                        Löscht abgelaufene Refresh-Token-Einträge aus der Datenbank.
                      </p>
                      <button
                        onClick={() => void runMaintenance("tokens")}
                        disabled={maintenanceLoading === "tokens"}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-ink-900/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-green-600/60 hover:text-green-500 disabled:opacity-60"
                      >
                        {maintenanceLoading === "tokens" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wrench className="h-4 w-4" />
                        )}
                        Ausführen
                      </button>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-ink-900/30 p-5">
                      <h3 className="mb-1 font-mono font-semibold text-muted-foreground">
                        Ausstehende Bestellungen ablaufen lassen
                      </h3>
                      <p className="mb-3 text-sm text-muted-foreground">
                        Markiert überfällige PENDING_PAYMENT-Bestellungen als CANCELLED.
                      </p>
                      <button
                        onClick={() => void runMaintenance("orders")}
                        disabled={maintenanceLoading === "orders"}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-ink-900/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-green-600/60 hover:text-green-500 disabled:opacity-60"
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
