"use client"

import { Fragment, useState } from "react"
import { ChevronDown, Loader2, Send } from "lucide-react"
import type { PayoutDueItem } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { duePayoutFeeChain } from "@/src/lib/settlement"
import { ADMIN_TH_CLASS, ADMIN_THEAD_CLASS, ADMIN_TR_CLASS } from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
import SettlementBreakdown from "@/src/components/shared/SettlementBreakdown"
import { Button } from "@/src/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"

interface DuePayoutsTableProps {
  items: PayoutDueItem[]
  onRelease: (item: PayoutDueItem) => void
  releasingSellerId: string | null
}

export default function DuePayoutsTable({
  items,
  onRelease,
  releasingSellerId,
}: DuePayoutsTableProps) {
  /**
   * Vor der Freigabe muss nachvollziehbar sein, **warum** ausgerechnet dieser
   * Betrag fließt (#53). Die verdichtete Kette Brutto → Retoure → Provision →
   * Stripe-Gebühr → Chargeback → Netto steht deshalb ausklappbar unter der
   * Zeile — der Klick auf „Freigeben" ist endgültig.
   */
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 rounded-lg border border-border/60 bg-ink-900/30 p-4 text-sm text-muted-foreground">
        Auszahlungen werden <span className="text-muted-foreground">monatlich</span> manuell
        freigegeben. Aufgeführt sind pro Verkäufer alle gelieferten, noch nicht ausgezahlten
        Abrechnungen. Eine Freigabe ist nur bei aktivem Stripe-Auszahlungskonto möglich.
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Keine fälligen Auszahlungen.</p>
      ) : (
        <Table>
          <TableHeader className={ADMIN_THEAD_CLASS}>
            <TableRow>
              <TableHead className={ADMIN_TH_CLASS}>Verkäufer</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Konto</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Abrechnungen</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Brutto</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Abzüge</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Netto</TableHead>
              <TableHead className={ADMIN_TH_CLASS} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((d) => {
              const canRelease = d.payoutAccountStatus === "ACTIVE"
              const chain = duePayoutFeeChain(d)
              const open = expanded === d.sellerId
              const detailId = `due-payout-breakdown-${d.sellerId}`
              return (
                <Fragment key={d.sellerId}>
                  <TableRow className={ADMIN_TR_CLASS}>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">
                      {d.sellerName}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <StatusBadge
                        label={d.payoutAccountStatus}
                        colorClasses={
                          canRelease
                            ? "bg-green-700/40 text-green-500 ring-1 ring-green-500/40"
                            : "bg-warning/40 text-warning ring-1 ring-warning/40"
                        }
                      />
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">
                      {d.settlementCount}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">
                      {formatEuro(chain.gross)}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : d.sellerId)}
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
                    </TableCell>
                    <TableCell
                      className={`px-3 py-2.5 font-medium ${
                        chain.net < 0 ? "text-danger" : "text-green-500"
                      }`}
                    >
                      {formatEuro(chain.net)}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRelease(d)}
                        disabled={!canRelease || releasingSellerId === d.sellerId}
                        title={
                          canRelease
                            ? "Auszahlung freigeben"
                            : "Verkäufer hat kein aktives Auszahlungskonto"
                        }
                        className="h-8 gap-1.5 border-green-600/60 bg-green-700/30 text-xs text-green-500 disabled:opacity-40 [&_svg]:size-3.5"
                      >
                        {releasingSellerId === d.sellerId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Freigeben
                      </Button>
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="px-3 pb-4 pt-0">
                        <div id={detailId}>
                          <SettlementBreakdown
                            chain={chain}
                            variant="dark"
                            netLabel="Auszuzahlen"
                          />
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
  )
}
