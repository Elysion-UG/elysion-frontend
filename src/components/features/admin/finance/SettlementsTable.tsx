import type { Settlement } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
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

export default function SettlementsTable({ items }: { items: Settlement[] }) {
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
            <TableHead className={ADMIN_TH_CLASS}>Netto</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((s) => (
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
