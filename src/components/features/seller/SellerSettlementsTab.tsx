"use client"

import { useState, useEffect, useCallback } from "react"
import { useEffectEvent } from "@/src/hooks/use-effect-event"
import { DollarSign, RefreshCw, Loader2 } from "lucide-react"
import { SellerOrderService } from "@/src/services/seller-order.service"
import type { Settlement } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"
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
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [settlementsLoading, setSettlementsLoading] = useState(false)

  const fetchSettlements = useCallback(async () => {
    setSettlementsLoading(true)
    try {
      const data = await SellerOrderService.listSettlements()
      setSettlements(data)
    } catch {
      toast.error("Auszahlungen konnten nicht geladen werden.")
    } finally {
      setSettlementsLoading(false)
    }
  }, [])

  const runSettlementsEffect = useEffectEvent(() => {
    fetchSettlements()
  })
  useEffect(() => {
    runSettlementsEffect()
  }, [fetchSettlements])

  return (
    <div className="space-y-6">
      <SellerPayoutAccountCard />

      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Abrechnungen</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Auszahlungen erfolgen monatlich, sobald die Bestellung als geliefert gilt.
            </p>
          </div>
          <button
            onClick={fetchSettlements}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${settlementsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {settlementsLoading ? (
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
