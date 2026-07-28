import type { AdminPaymentItem } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { ADMIN_PAYMENT_STATUS_COLOR as paymentStatusColor } from "@/src/lib/constants"
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

export default function PaymentsTable({ items }: { items: AdminPaymentItem[] }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">Keine Zahlungen gefunden.</p>
  }
  return (
    <div className="overflow-x-auto">
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
          {items.map((p) => (
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
                  colorClasses={paymentStatusColor[p.status] ?? "bg-ink-900 text-muted-foreground"}
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
    </div>
  )
}
