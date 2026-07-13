"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ToggleLeft, ToggleRight, ExternalLink } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { AdminService } from "@/src/services/admin.service"
import type { AdminProductListItem, ProductStatus } from "@/src/types"
import {
  ADMIN_PRODUCT_STATUS_LABEL as statusLabel,
  ADMIN_PRODUCT_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import {
  AdminListPage,
  SearchInput,
  RefreshButton,
  ADMIN_SELECT_CLASS,
} from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
import { TableCell } from "@/src/components/ui/table"
import { useAdminList } from "@/src/hooks/useAdminList"
import { toast } from "sonner"

export default function AdminProducts() {
  const router = useRouter()
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("")
  const [searchQuery, setSearchQuery] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    AdminService.listSellers({ page: 0, size: 200 })
      .then((res) => {
        const map: Record<string, string> = {}
        for (const s of res.items ?? []) {
          map[s.id] = s.companyName
          map[s.userId] = s.companyName
        }
        setSellerNames(map)
      })
      .catch(() => {})
  }, [])

  const fetchPage = useCallback(
    async (page: number) => {
      const res = await AdminService.listProducts({
        page,
        size: 20,
        status: statusFilter || undefined,
      })
      const items = res.items ?? []
      return {
        items: searchQuery
          ? items.filter((p) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
          : items,
        totalPages: res.totalPages ?? 1,
      }
    },
    [statusFilter, searchQuery]
  )

  const { items, isLoading, page, totalPages, setPage, reload } = useAdminList({
    fetchPage,
    errorMessage: "Fehler beim Laden der Produkte.",
  })

  const handleActivate = async (p: AdminProductListItem) => {
    setActionLoading(p.id)
    try {
      await AdminService.activateProduct(p.id)
      toast.success(`"${p.name}" aktiviert.`)
      reload()
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
      reload()
    } catch {
      toast.error("Fehler beim Deaktivieren.")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminListPage<AdminProductListItem>
      title="Produkt-Verwaltung"
      subtitle="Übersicht und Aktivierung aller Plattform-Produkte"
      filters={
        <>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Produkt oder Verkäufer suchen..."
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ProductStatus | "")
              setPage(0)
            }}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="">Alle Status</option>
            {(["DRAFT", "REVIEW", "ACTIVE", "INACTIVE", "REJECTED"] as ProductStatus[]).map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
          <RefreshButton onClick={reload} />
        </>
      }
      columns={[
        { header: "Produkt", key: "product" },
        { header: "Verkäufer", key: "seller" },
        { header: "Status", key: "status" },
        { header: "Erstellt", key: "created" },
        { header: "Aktionen", key: "actions", className: "text-right" },
      ]}
      rows={items}
      isLoading={isLoading}
      emptyMessage="Keine Produkte gefunden."
      getRowKey={(product) => product.id}
      onRowClick={(product) => router.push(`/admin/products/${product.id}`)}
      renderRow={(product) => (
        <>
          <TableCell className="px-4 py-3 font-medium text-slate-200">
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
          </TableCell>
          <TableCell className="px-4 py-3 text-sm text-slate-400">
            {sellerNames[product.sellerId] ?? (
              <span className="font-mono text-xs text-slate-600">
                {product.sellerId.slice(0, 8)}…
              </span>
            )}
          </TableCell>
          <TableCell className="px-4 py-3">
            <StatusBadge
              label={statusLabel[product.status]}
              colorClasses={statusColor[product.status]}
            />
          </TableCell>
          <TableCell className="px-4 py-3 text-slate-500">
            {new Date(product.createdAt).toLocaleDateString("de-DE")}
          </TableCell>
          <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
          </TableCell>
        </>
      )}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  )
}
