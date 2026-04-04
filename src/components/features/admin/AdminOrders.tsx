"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Search, Loader2, RefreshCw } from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminOrderListItem, OrderStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import {
  ADMIN_ORDER_STATUS_LABEL as statusLabel,
  ADMIN_ORDER_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import { toast } from "sonner"

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<AdminOrderListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("")
  const [searchQuery, setSearchQuery] = useState("")

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await AdminService.listOrders({
        page,
        size: 20,
        status: statusFilter || undefined,
      })
      const items = res.items ?? []
      setOrders(
        searchQuery
          ? items.filter(
              (o) =>
                o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.guestEmail?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : items
      )
      setTotalPages(res.totalPages ?? 1)
    } catch {
      toast.error("Fehler beim Laden der Bestellungen.")
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-slate-100">
          Bestellungs-Verwaltung
        </h1>
        <p className="mt-1 text-sm text-slate-500">Übersicht aller Plattform-Bestellungen</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Bestellnummer oder E-Mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as OrderStatus | "")
            setPage(0)
          }}
          className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
        >
          <option value="">Alle Status</option>
          {(Object.keys(statusLabel) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <RefreshCw className="h-4 w-4" /> Aktualisieren
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/60">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-slate-500">Keine Bestellungen gefunden.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800/60 bg-slate-800/30">
              <tr>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Bestellnr.
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Käufer
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Zahlung
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Gesamt
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="cursor-pointer transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3 font-mono text-slate-300">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {order.guestEmail ?? order.userId?.slice(0, 8) ?? "–"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[order.status]}`}
                    >
                      {statusLabel[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{order.paymentStatus}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {formatEuro(order.total)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/60 px-4 py-3">
            <span className="text-sm text-slate-500">
              Seite {page + 1} von {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-slate-700/60 bg-slate-800/60 p-1.5 text-slate-400 hover:bg-slate-700/60 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-slate-700/60 bg-slate-800/60 p-1.5 text-slate-400 hover:bg-slate-700/60 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
