"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminProductListItem, ProductStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"

const statusLabel: Record<ProductStatus, string> = {
  DRAFT: "Entwurf",
  REVIEW: "Prüfung",
  ACTIVE: "Aktiv",
  INACTIVE: "Inaktiv",
  REJECTED: "Abgelehnt",
}

const statusColor: Record<ProductStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  REVIEW: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  REJECTED: "bg-red-100 text-red-700",
}

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProductListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("")
  const [searchQuery, setSearchQuery] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await AdminService.listProducts({
        page,
        size: 20,
        status: statusFilter || undefined,
      })
      const items = res.items ?? []
      setProducts(
        searchQuery
          ? items.filter(
              (p) =>
                p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sellerName?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : items
      )
      setTotalPages(res.totalPages ?? 1)
    } catch {
      toast.error("Fehler beim Laden der Produkte.")
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    load()
  }, [load])

  const handleActivate = async (p: AdminProductListItem) => {
    setActionLoading(p.id)
    try {
      await AdminService.activateProduct(p.id)
      toast.success(`"${p.title}" aktiviert.`)
      load()
    } catch {
      toast.error("Fehler beim Aktivieren.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeactivate = async (p: AdminProductListItem) => {
    setActionLoading(p.id)
    try {
      await AdminService.deactivateProduct(p.id)
      toast.success(`"${p.title}" deaktiviert.`)
      load()
    } catch {
      toast.error("Fehler beim Deaktivieren.")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Produkt-Verwaltung</h1>
          <p className="mt-1 text-sm text-slate-500">
            Übersicht und Aktivierung aller Plattform-Produkte
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Produkt oder Verkäufer suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ProductStatus | "")
              setPage(0)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Alle Status</option>
            {(["DRAFT", "REVIEW", "ACTIVE", "INACTIVE", "REJECTED"] as ProductStatus[]).map((s) => (
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
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-slate-500">Keine Produkte gefunden.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Produkt</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Verkäufer</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Preis</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Erstellt</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-slate-50">
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-800">
                      {product.title}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {product.sellerName ?? product.sellerId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatEuro(product.price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[product.status]}`}
                      >
                        {statusLabel[product.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(product.createdAt).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                        ) : product.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleDeactivate(product)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                            title="Deaktivieren"
                          >
                            <ToggleLeft className="h-4 w-4" /> Deaktivieren
                          </button>
                        ) : product.status === "INACTIVE" || product.status === "REVIEW" ? (
                          <button
                            onClick={() => handleActivate(product)}
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            title="Aktivieren"
                          >
                            <ToggleRight className="h-4 w-4" /> Aktivieren
                          </button>
                        ) : null}
                      </div>
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
