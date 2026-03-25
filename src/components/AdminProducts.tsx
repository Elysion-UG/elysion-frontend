"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Search, Loader2, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react"
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
      const res = await AdminService.listProducts({ page, size: 20, status: statusFilter || undefined })
      const items = res.items ?? []
      setProducts(searchQuery ? items.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sellerName?.toLowerCase().includes(searchQuery.toLowerCase())
      ) : items)
      setTotalPages(res.totalPages ?? 1)
    } catch { toast.error("Fehler beim Laden der Produkte.") }
    finally { setIsLoading(false) }
  }, [page, statusFilter, searchQuery])

  useEffect(() => { load() }, [load])

  const handleActivate = async (p: AdminProductListItem) => {
    setActionLoading(p.id)
    try {
      await AdminService.activateProduct(p.id)
      toast.success(`"${p.title}" aktiviert.`)
      load()
    } catch { toast.error("Fehler beim Aktivieren.") }
    finally { setActionLoading(null) }
  }

  const handleDeactivate = async (p: AdminProductListItem) => {
    setActionLoading(p.id)
    try {
      await AdminService.deactivateProduct(p.id)
      toast.success(`"${p.title}" deaktiviert.`)
      load()
    } catch { toast.error("Fehler beim Deaktivieren.") }
    finally { setActionLoading(null) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Produkt-Verwaltung</h1>
          <p className="text-slate-500 text-sm mt-1">Übersicht und Aktivierung aller Plattform-Produkte</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Produkt oder Verkäufer suchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as ProductStatus | ""); setPage(0) }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Alle Status</option>
            {(["DRAFT", "REVIEW", "ACTIVE", "INACTIVE", "REJECTED"] as ProductStatus[]).map(s => (
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
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-slate-500">Keine Produkte gefunden.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Produkt</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Verkäufer</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Preis</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Erstellt</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">{product.title}</td>
                    <td className="px-4 py-3 text-slate-500">{product.sellerName ?? product.sellerId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatEuro(product.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[product.status]}`}>
                        {statusLabel[product.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(product.createdAt).toLocaleDateString("de-DE")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                        ) : product.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleDeactivate(product)}
                            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50"
                            title="Deaktivieren"
                          >
                            <ToggleLeft className="w-4 h-4" /> Deaktivieren
                          </button>
                        ) : product.status === "INACTIVE" || product.status === "REVIEW" ? (
                          <button
                            onClick={() => handleActivate(product)}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-50"
                            title="Aktivieren"
                          >
                            <ToggleRight className="w-4 h-4" /> Aktivieren
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
