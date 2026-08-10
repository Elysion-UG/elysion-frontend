import type { AdminRefundItem } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
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

const REFUND_STATUS_COLOR: Record<string, string> = {
  SUCCEEDED: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  PENDING: "bg-warning/40 text-warning ring-1 ring-warning/40",
  FAILED: "bg-destructive/30 text-danger ring-1 ring-danger/40",
}

export default function RefundsTable({ items }: { items: AdminRefundItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Keine Erstattungen gefunden. Neue Erstattungen lösen Sie über „Erstattung auslösen" aus.
      </p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <div className="mb-4 rounded-lg border border-border/60 bg-ink-900/30 p-4 text-sm text-muted-foreground">
        Der Regelweg ist die{" "}
        <span className="text-muted-foreground">Selbstbedienung des Verkäufers</span>; diese Liste
        ist die Historie aller Erstattungen. Eine Erstattung von hier aus ist die{" "}
        <span className="text-muted-foreground">Eskalation</span> — sie braucht keine Zustimmung des
        Verkäufers und wird im Prüfprotokoll festgehalten. Grund und Auslöser liefert die Leseliste
        nicht mit; beides steht im Prüfprotokoll.
      </div>
      <Table>
        <TableHeader className={ADMIN_THEAD_CLASS}>
          <TableRow>
            <TableHead className={ADMIN_TH_CLASS}>ID</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Bestell-ID (OrderGroup)</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Payment-ID</TableHead>
            <TableHead className={ADMIN_TH_CLASS}>Betrag</TableHead>
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
                {r.orderGroupId ? `${r.orderGroupId.slice(0, 12)}…` : "–"}
              </TableCell>
              <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                {r.paymentId.slice(0, 12)}…
              </TableCell>
              <TableCell className="px-3 py-2.5 font-medium text-muted-foreground">
                {formatEuro(r.amount)}
              </TableCell>
              <TableCell className="px-3 py-2.5">
                <StatusBadge
                  label={r.status}
                  colorClasses={REFUND_STATUS_COLOR[r.status] ?? "bg-ink-900 text-muted-foreground"}
                />
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
