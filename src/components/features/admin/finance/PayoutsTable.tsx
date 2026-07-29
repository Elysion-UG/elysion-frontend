import type { AdminPayoutItem } from "@/src/types"
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

export default function PayoutsTable({ items }: { items: AdminPayoutItem[] }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">Keine Auszahlungen gefunden.</p>
  }
  return (
    <div className="overflow-x-auto">
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
          {items.map((p) => (
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
    </div>
  )
}
