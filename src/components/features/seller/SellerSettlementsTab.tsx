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

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Abrechnungen</h2>
            <p className="mt-1 text-sm text-slate-500">
              Auszahlungen erfolgen monatlich, sobald die Bestellung als geliefert gilt.
            </p>
          </div>
          <button
            onClick={fetchSettlements}
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <RefreshCw className={`h-4 w-4 ${settlementsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {settlementsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : settlements.length === 0 ? (
          <div className="py-12 text-center">
            <DollarSign className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">Noch keine Auszahlungen.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50">
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Datum</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Brutto</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Plattformgebühr</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Netto</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((s) => (
                <TableRow key={s.settlementId} className="hover:bg-slate-50">
                  <TableCell className={`${SELLER_TABLE_CELL_CLASS} text-sm text-slate-600`}>
                    {new Date(s.createdAt).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell className={`${SELLER_TABLE_CELL_CLASS} text-sm text-slate-800`}>
                    {formatEuro(s.grossAmount)}
                  </TableCell>
                  <TableCell className={`${SELLER_TABLE_CELL_CLASS} text-sm text-slate-500`}>
                    {formatEuro(s.platformFeeAmount)}
                  </TableCell>
                  <TableCell
                    className={`${SELLER_TABLE_CELL_CLASS} text-sm font-semibold text-teal-700`}
                  >
                    {formatEuro(s.netAmount)}
                  </TableCell>
                  <TableCell className={SELLER_TABLE_CELL_CLASS}>
                    <StatusBadge
                      label={settlementStatusLabel[s.status] ?? s.status}
                      colorClasses={settlementStatusColor[s.status] ?? "bg-blue-100 text-blue-700"}
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
