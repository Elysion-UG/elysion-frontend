"use client"

import React, { useState } from "react"
import { DollarSign, CreditCard, ArrowDownLeft, Banknote, Wrench, HandCoins } from "lucide-react"
import { PageHeader, RefreshButton, LoadingFullPage } from "@/src/components/shared"
import {
  useAdminPayments,
  useAdminRefunds,
  useAdminSettlements,
  useDuePayouts,
  useAdminPayouts,
  useReleasePayout,
  useRunMaintenance,
} from "@/src/hooks/useAdminFinance"
import PaymentsTable from "./finance/PaymentsTable"
import RefundsTable from "./finance/RefundsTable"
import SettlementsTable from "./finance/SettlementsTable"
import DuePayoutsTable from "./finance/DuePayoutsTable"
import PayoutsTable from "./finance/PayoutsTable"
import MaintenancePanel from "./finance/MaintenancePanel"

type Tab = "payments" | "refunds" | "settlements" | "due" | "payouts" | "maintenance"

export default function AdminFinance() {
  const [tab, setTab] = useState<Tab>("payments")

  // Each list query only fetches while its tab is active; TanStack Query keeps
  // the result cached so re-visiting a tab is instant (#35).
  const payments = useAdminPayments(tab === "payments")
  const refunds = useAdminRefunds(tab === "refunds")
  const settlements = useAdminSettlements(tab === "settlements")
  const due = useDuePayouts(tab === "due")
  const payouts = useAdminPayouts(tab === "payouts")

  const releasePayout = useReleasePayout()
  const maintenance = useRunMaintenance()

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "payments", label: "Zahlungen", icon: <CreditCard className="h-4 w-4" /> },
    { id: "refunds", label: "Erstattungen", icon: <ArrowDownLeft className="h-4 w-4" /> },
    { id: "settlements", label: "Abrechnungen", icon: <DollarSign className="h-4 w-4" /> },
    { id: "due", label: "Fällige Auszahlungen", icon: <HandCoins className="h-4 w-4" /> },
    { id: "payouts", label: "Auszahlungen", icon: <Banknote className="h-4 w-4" /> },
    { id: "maintenance", label: "Wartung", icon: <Wrench className="h-4 w-4" /> },
  ]

  // The list-backed tabs share the refresh/loading chrome; maintenance is
  // action-only and has no query behind it.
  const activeQuery =
    tab === "payments"
      ? payments
      : tab === "refunds"
        ? refunds
        : tab === "settlements"
          ? settlements
          : tab === "due"
            ? due
            : tab === "payouts"
              ? payouts
              : null

  const releasingSellerId =
    releasePayout.isPending && releasePayout.variables ? releasePayout.variables.sellerId : null

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
          {activeQuery && (
            <div className="mb-4 flex justify-end">
              <RefreshButton
                onClick={() => void activeQuery.refetch()}
                isLoading={activeQuery.isFetching}
              />
            </div>
          )}

          {activeQuery?.isLoading ? (
            <LoadingFullPage />
          ) : activeQuery?.isError ? (
            <div className="py-8 text-center text-danger">
              Fehler beim Laden.{" "}
              <button
                onClick={() => void activeQuery.refetch()}
                className="underline hover:text-muted-foreground"
              >
                Erneut versuchen
              </button>
            </div>
          ) : (
            <>
              {tab === "payments" && <PaymentsTable items={payments.data ?? []} />}
              {tab === "refunds" && <RefundsTable items={refunds.data ?? []} />}
              {tab === "settlements" && <SettlementsTable items={settlements.data ?? []} />}
              {tab === "due" && (
                <DuePayoutsTable
                  items={due.data ?? []}
                  onRelease={(item) =>
                    releasePayout.mutate({ sellerId: item.sellerId, sellerName: item.sellerName })
                  }
                  releasingSellerId={releasingSellerId}
                />
              )}
              {tab === "payouts" && <PayoutsTable items={payouts.data ?? []} />}
              {tab === "maintenance" && (
                <MaintenancePanel
                  onRun={(action) => maintenance.mutate(action)}
                  loadingAction={maintenance.isPending ? (maintenance.variables ?? null) : null}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
