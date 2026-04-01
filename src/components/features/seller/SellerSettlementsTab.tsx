"use client"

import { useState, useEffect, useCallback } from "react"
import { DollarSign, RefreshCw, Loader2 } from "lucide-react"
import { SellerOrderService } from "@/src/services/seller-order.service"
import type { Settlement } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"

export default function SellerSettlementsTab() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [settlementsLoading, setSettlementsLoading] = useState(false)

  const fetchSettlements = useCallback(async () => {
    setSettlementsLoading(true)
    try {
      const data = await SellerOrderService.listSettlements({ size: 100 })
      setSettlements(
        Array.isArray(data)
          ? (data as unknown as Settlement[])
          : ((data as unknown as { content: Settlement[] }).content ?? [])
      )
    } catch {
      toast.error("Auszahlungen konnten nicht geladen werden.")
    } finally {
      setSettlementsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800">Auszahlungen</h2>
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Zeitraum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Brutto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Plattformgebühr
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Netto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(s.periodStart).toLocaleDateString("de-DE")} –{" "}
                    {new Date(s.periodEnd).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800">
                    {formatEuro(s.grossAmountCents / 100)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatEuro(s.platformFeeCents / 100)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-teal-700">
                    {formatEuro(s.netAmountCents / 100)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : s.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
