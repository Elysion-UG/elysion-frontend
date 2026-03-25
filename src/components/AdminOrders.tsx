"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Search, Loader2, RefreshCw, Eye } from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminOrderListItem, OrderStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"

const statusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Zahlung ausstehend",
  PAID: "Bezahlt",
  CONFIRMED: "Bestätigt",
  PROCESSING: "In Bearbeitung",
  SHIPPED: "Versandt",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
  REFUNDED: "Erstattet",
}

const statusColor: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-orange-100 text-orange-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-600",
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("")
  const [searchQuery, setSearchQuery] = useState("")

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await AdminService.listOrders({ page, size: 20, status: statusFilter || undefined })
      const items = res.items ?? []
      setOrders(searchQuery ? items.filter(o =>
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.guestEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      ) : items)
      setTotalPages(res.totalPages ?? 1)
    } catch { toast.error("Fehler beim Laden der Bestellungen.") }
    finally { setIsLoading(false) }
  }, [page, statusFilter, searchQuery])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Bestellungs-Verwaltung</h1>
          <p className="text-slate-500 text-sm mt-1">Übersicht aller Plattform-Bestellungen</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Bestellnummer oder E-Mail..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as OrderStatus | ""); setPage(0) }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Alle Status</option>
            {(Object.keys(statusLabel) as OrderStatus[]).map(s => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </select>
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-2">
            <RefreshCw className="w-4 h-4" /> Aktualisieren
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-slate-500">Keine Bestellungen gefunden.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Bestellnr.</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Käufer</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Zahlung</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Gesamt</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Datum</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-800">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{order.guestEmail ?? order.userId?.slice(0, 8) ?? "–"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status]}`}>
                        {statusLabel[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{order.paymentStatus}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{formatEuro(order.total)}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString("de-DE")}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ansehen
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">Seite {page + 1} von {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
