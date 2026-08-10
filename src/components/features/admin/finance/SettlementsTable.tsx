import { Undo2 } from "lucide-react"
import type { Settlement } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { remainingRefundable } from "@/src/lib/refund"
import { ADMIN_SETTLEMENT_STATUS_COLOR as settlementStatusColor } from "@/src/lib/constants"
import { ADMIN_TH_CLASS, ADMIN_THEAD_CLASS, ADMIN_TR_CLASS } from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
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
            <TableHead className={ADMIN_TH_CLASS}>Netto</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
            {onRefund && <TableHead className={ADMIN_TH_CLASS} />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((s) => {
            const remaining = remainingRefundable(s)
            return (
              <TableRow key={s.settlementId} className={ADMIN_TR_CLASS}>
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
                <TableCell className="px-3 py-2.5 font-medium text-green-500">
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
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
