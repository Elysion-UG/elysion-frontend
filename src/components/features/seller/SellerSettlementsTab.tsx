"use client"

import { DollarSign, RefreshCw, Loader2, Info } from "lucide-react"
import { useSellerSettlements } from "@/src/hooks/useSellerDashboard"
import { formatEuro } from "@/src/lib/currency"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"
import { StatusBadge } from "@/src/components/shared"
import {
  settlementStatusLabel,
  settlementStatusColor,
  SELLER_TABLE_HEAD_CLASS,
  SELLER_TABLE_CELL_CLASS,
} from "./sellerDashboard.constants"
import SellerPayoutAccountCard from "./SellerPayoutAccountCard"

export default function SellerSettlementsTab() {
  const { data: settlements = [], isFetching, refetch } = useSellerSettlements()

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
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Plattformgebühr</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Netto</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((s) => (
                <TableRow key={s.settlementId} className="hover:bg-secondary">
                  <TableCell className={`${SELLER_TABLE_CELL_CLASS} text-sm text-foreground`}>
                    {new Date(s.createdAt).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell className={`${SELLER_TABLE_CELL_CLASS} text-sm text-foreground`}>
                    {formatEuro(s.grossAmount)}
                  </TableCell>
                  <TableCell className={`${SELLER_TABLE_CELL_CLASS} text-sm text-muted-foreground`}>
                    {formatEuro(s.platformFeeAmount)}
                  </TableCell>
                  <TableCell
                    className={`${SELLER_TABLE_CELL_CLASS} text-sm font-semibold text-green-600`}
                  >
                    {formatEuro(s.netAmount)}
                  </TableCell>
                  <TableCell className={SELLER_TABLE_CELL_CLASS}>
                    <StatusBadge
                      label={settlementStatusLabel[s.status] ?? s.status}
                      colorClasses={settlementStatusColor[s.status] ?? "bg-info-tint text-info"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
