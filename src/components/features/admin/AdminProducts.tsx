"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminProductListItem, ProductStatus } from "@/src/types"
import {
  ADMIN_PRODUCT_STATUS_LABEL as statusLabel,
  ADMIN_PRODUCT_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import { toast } from "sonner"

export default function AdminProducts() {
  const router = useRouter()
  const [products, setProducts] = useState<AdminProductListItem[]>([])
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("")
  const [searchQuery, setSearchQuery] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    AdminService.listSellers({ page: 0, size: 200 })
      .then((res) => {
        const map: Record<string, string> = {}
        for (const s of res.items ?? []) {
          // index by both profile-id and user-id so sellerId always resolves
          map[s.id] = s.companyName
          map[s.userId] = s.companyName
        }
        setSellerNames(map)
      })
      .catch(() => {})
  }, [])

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
          ? items.filter((p) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
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
      toast.success(`"${p.name}" aktiviert.`)
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
      toast.success(`"${p.name}" deaktiviert.`)
      load()
    } catch {
      toast.error("Fehler beim Deaktivieren.")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-slate-100">
          Produkt-Verwaltung
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Übersicht und Aktivierung aller Plattform-Produkte
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Produkt oder Verkäufer suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ProductStatus | "")
            setPage(0)
          }}
          className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
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
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-500">Keine Produkte gefunden.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800/60 bg-slate-800/30">
              <tr>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Produkt
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Verkäufer
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Erstellt
                </th>
                <th className="px-4 py-3 text-right font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => router.push(`/admin/products/${product.id}`)}
                  className="cursor-pointer transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3 font-medium text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="max-w-[220px] truncate">{product.name}</span>
                      <a
                        href={`/product?slug=${product.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Im Shop ansehen"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 text-slate-600 hover:text-slate-400"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {sellerNames[product.sellerId] ?? (
                      <span className="font-mono text-xs text-slate-600">
                        {product.sellerId.slice(0, 8)}…
                      </span>
                    )}
                  </td>
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
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {actionLoading === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-cyber-500" />
                      ) : product.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleDeactivate(product)}
                          className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                          title="Deaktivieren"
                        >
                          <ToggleLeft className="h-4 w-4" /> Deaktivieren
                        </button>
                      ) : product.status === "INACTIVE" || product.status === "REVIEW" ? (
                        <button
                          onClick={() => handleActivate(product)}
                          className="flex items-center gap-1 rounded-lg border border-emerald-800/60 bg-emerald-900/30 px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300"
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
