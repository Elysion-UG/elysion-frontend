"use client"

import { Fragment, useState } from "react"
import { ChevronDown, DollarSign, RefreshCw, Loader2, Info } from "lucide-react"
import { useSellerSettlements } from "@/src/hooks/useSellerDashboard"
import { formatEuro } from "@/src/lib/currency"
import { settlementFeeChain } from "@/src/lib/settlement"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"
import { StatusBadge, SettlementBreakdown } from "@/src/components/shared"
import {
  settlementStatusLabel,
  settlementStatusColor,
  SELLER_TABLE_HEAD_CLASS,
  SELLER_TABLE_CELL_CLASS,
} from "./sellerDashboard.constants"
import SellerPayoutAccountCard from "./SellerPayoutAccountCard"

export default function SellerSettlementsTab() {
  const { data: settlements = [], isFetching, refetch } = useSellerSettlements()
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <SellerPayoutAccountCard />

      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">Abrechnungen</h2>
              <span className="rounded-full bg-warning-tint px-2 py-0.5 text-xs font-medium text-warning">
                Vorläufig · unverbindlich
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Laufende Übersicht der auszahlungsfähigen Beträge.
            </p>
          </div>
          <button
            onClick={() => void refetch()}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Verbindlichkeits-Hinweis (Management-Decision §1.7) */}
        <div className="flex items-start gap-3 border-b border-border bg-info-tint/40 px-6 py-4 text-sm text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <p>
            Diese Übersicht ist <strong>vorläufig und unverbindlich</strong>. Verbindlich ist
            ausschließlich der wöchentliche Settlement-Bericht nach Ablauf der Einspruchsfrist (7
            Tage); nachträgliche Rückbuchungen oder Korrekturen werden mit dem nächsten Settlement
            verrechnet.
          </p>
        </div>

        {isFetching && settlements.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : settlements.length === 0 ? (
          <div className="py-12 text-center">
            <DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Noch keine Auszahlungen.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-secondary">
              <TableRow className="hover:bg-secondary">
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Datum</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Brutto</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Abzüge</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Netto</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Status</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>
                  <span className="sr-only">Aufschlüsselung</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((s) => {
                const chain = settlementFeeChain(s)
                const open = expanded === s.settlementId
                const detailId = `settlement-breakdown-${s.settlementId}`
                return (
                  <Fragment key={s.settlementId}>
                    <TableRow className="hover:bg-secondary">
                      <TableCell className={`${SELLER_TABLE_CELL_CLASS} text-sm text-foreground`}>
                        {new Date(s.createdAt).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell className={`${SELLER_TABLE_CELL_CLASS} text-sm text-foreground`}>
                        {formatEuro(chain.gross)}
                      </TableCell>
                      <TableCell className={`${SELLER_TABLE_CELL_CLASS} text-sm`}>
                        <span className="text-danger">-{formatEuro(chain.totalDeductions)}</span>
                        {/* Retoure und Chargeback bekommen eine eigene Kennzeichnung: sie
                          sind die Abzüge, die der Verkäufer nicht erwartet, wenn er nur
                          auf Umsatz und Provision schaut (§1.1). */}
                        <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                          {s.refundedAmount > 0 && (
                            <StatusBadge
                              label="Retoure"
                              colorClasses="bg-warning-tint text-warning"
                            />
                          )}
                          {s.chargebackAmount > 0 && (
                            <StatusBadge
                              label="Chargeback"
                              colorClasses="bg-danger-tint text-danger"
                            />
                          )}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`${SELLER_TABLE_CELL_CLASS} text-sm font-semibold ${
                          chain.net < 0 ? "text-danger" : "text-green-600"
                        }`}
                      >
                        {formatEuro(chain.net)}
                      </TableCell>
                      <TableCell className={SELLER_TABLE_CELL_CLASS}>
                        <StatusBadge
                          label={settlementStatusLabel[s.status] ?? s.status}
                          colorClasses={settlementStatusColor[s.status] ?? "bg-info-tint text-info"}
                        />
                      </TableCell>
                      <TableCell className={`${SELLER_TABLE_CELL_CLASS} text-right`}>
                        <button
                          type="button"
                          onClick={() => setExpanded(open ? null : s.settlementId)}
                          aria-expanded={open}
                          aria-controls={detailId}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Aufschlüsselung
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                          />
                        </button>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className="px-6 pb-6 pt-0">
                          <div id={detailId}>
                            <SettlementBreakdown chain={chain} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
