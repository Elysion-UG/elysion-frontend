"use client"

import { Fragment, useState } from "react"
import { ChevronDown, Undo2 } from "lucide-react"
import type { Settlement } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { remainingRefundable } from "@/src/lib/refund"
import { settlementFeeChain } from "@/src/lib/settlement"
import { ADMIN_SETTLEMENT_STATUS_COLOR as settlementStatusColor } from "@/src/lib/constants"
import { ADMIN_TH_CLASS, ADMIN_THEAD_CLASS, ADMIN_TR_CLASS } from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
import SettlementBreakdown from "@/src/components/shared/SettlementBreakdown"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"

interface SettlementsTableProps {
  items: Settlement[]
  /**
   * Startet die Eskalations-Erstattung für diese Zeile (#56). Fehlt der
   * Callback, bleibt die Tabelle rein lesend.
   */
  onRefund?: (settlement: Settlement) => void
}

export default function SettlementsTable({ items, onRefund }: SettlementsTableProps) {
  /**
   * Die volle Gebührenkette (#53) steht nicht als neun Spalten im Kopf, sondern
   * ausgeklappt unter der Zeile: Die Übersicht bleibt überfliegbar, die
   * Herleitung Brutto → Abzüge → Netto ist einen Klick entfernt.
   */
  const [expanded, setExpanded] = useState<string | null>(null)
  const columnCount = onRefund ? 9 : 8

  if (items.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">Keine Abrechnungen gefunden.</p>
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className={ADMIN_THEAD_CLASS}>
          <TableRow>
            <TableHead className={ADMIN_TH_CLASS}>Verkäufer</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Zeitraum</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Brutto</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Gebühr</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Erstattet</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Abzüge</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Netto</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
            {onRefund && <TableHead className={ADMIN_TH_CLASS} />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((s) => {
            const remaining = remainingRefundable(s)
            const chain = settlementFeeChain(s)
            const open = expanded === s.settlementId
            const detailId = `admin-settlement-breakdown-${s.settlementId}`
            return (
              <Fragment key={s.settlementId}>
                <TableRow className={ADMIN_TR_CLASS}>
                  <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {s.sellerId.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                    {s.eligibleAt ? new Date(s.eligibleAt).toLocaleDateString("de-DE") : "–"}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-muted-foreground">
                    {formatEuro(s.grossAmount)}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-danger">
                    -{formatEuro(s.platformFeeAmount)}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-muted-foreground">
                    {s.refundedAmount ? `-${formatEuro(s.refundedAmount)}` : "–"}
                  </TableCell>
                  {/* Summe **aller** Abzüge inklusive Stripe-Fee und Chargeback — die
                      beiden Spalten davor zeigen nur zwei der Positionen. */}
                  <TableCell className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : s.settlementId)}
                      aria-expanded={open}
                      aria-controls={detailId}
                      className="inline-flex items-center gap-1 text-danger transition-colors hover:text-foreground"
                      title="Aufschlüsselung Brutto → Abzüge → Netto"
                    >
                      -{formatEuro(chain.totalDeductions)}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {s.chargebackAmount > 0 && (
                      <StatusBadge
                        label="Chargeback"
                        colorClasses="ml-2 bg-danger/30 text-danger ring-1 ring-danger/40"
                      />
                    )}
                  </TableCell>
                  <TableCell
                    className={`px-3 py-2.5 font-medium ${
                      s.netAmount < 0 ? "text-danger" : "text-green-500"
                    }`}
                  >
                    {formatEuro(s.netAmount)}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <StatusBadge
                      label={s.status}
                      colorClasses={
                        settlementStatusColor[s.status] ?? "bg-ink-900 text-muted-foreground"
                      }
                    />
                  </TableCell>
                  {onRefund && (
                    <TableCell className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => onRefund(s)}
                        disabled={!s.orderGroupId || remaining <= 0}
                        title={
                          !s.orderGroupId
                            ? "Zeile ohne Bestell-ID — Erstattung nicht zuordenbar"
                            : remaining <= 0
                              ? "Vollständig erstattet"
                              : "Erstattung auslösen"
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-ink-900/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Erstatten
                      </button>
                    </TableCell>
                  )}
                </TableRow>
                {open && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={columnCount} className="px-3 pb-4 pt-0">
                      <div id={detailId}>
                        <SettlementBreakdown chain={chain} variant="dark" />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
