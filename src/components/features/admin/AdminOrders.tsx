"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Search, Loader2, RefreshCw, Eye } from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminOrderListItem, OrderStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"

const statusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Zahlung ausstehend",
  PENDING: "Ausstehend",
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
  PENDING: "bg-yellow-100 text-yellow-700",
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Bestellungs-Verwaltung</h1>
          <p className="mt-1 text-sm text-slate-500">Übersicht aller Plattform-Bestellungen</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Bestellnummer oder E-Mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | "")
              setPage(0)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <RefreshCw className="h-4 w-4" /> Aktualisieren
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-500">Keine Bestellungen gefunden.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Bestellnr.</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Käufer</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Zahlung</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Gesamt</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Datum</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-800">{order.orderNumber}</td>
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
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatEuro(order.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ansehen
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <span className="text-sm text-slate-500">
                Seite {page + 1} von {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
