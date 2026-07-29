import type { AdminRefundItem } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { ADMIN_TH_CLASS, ADMIN_THEAD_CLASS, ADMIN_TR_CLASS } from "@/src/components/shared"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"

export default function RefundsTable({ items }: { items: AdminRefundItem[] }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">Keine Erstattungen gefunden.</p>
  }
  return (
    <div className="overflow-x-auto">
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
          {items.map((r) => (
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
    </div>
  )
}
