"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Ban, Loader2 } from "lucide-react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import { AdminService } from "@/src/services/admin.service"
import type { AdminSellerListItem, SellerStatus } from "@/src/types"
import {
  ADMIN_SELLER_STATUS_LABEL as statusLabel,
  ADMIN_SELLER_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import {
  PageHeader,
  AdminFilterBar,
  SearchInput,
  RefreshButton,
  AdminTableContainer,
  AdminTablePagination,
  ADMIN_TH_CLASS,
  ADMIN_THEAD_CLASS,
  ADMIN_TR_CLICKABLE_CLASS,
  ADMIN_SELECT_CLASS,
} from "@/src/components/shared"
import { cn } from "@/src/lib/utils"
import StatusBadge from "@/src/components/shared/StatusBadge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"
import { toast } from "sonner"

function RejectModal({
  seller,
  onClose,
  onDone,
}: {
  seller: AdminSellerListItem
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Bitte Ablehnungsgrund angeben.")
      return
    }
    setLoading(true)
    try {
      await AdminService.rejectSellerProfile(seller.id, reason)
      toast.success("Verkäufer abgelehnt.")
      onDone()
    } catch {
      toast.error("Fehler beim Ablehnen.")
    } finally {
      setLoading(false)
    }
  }

  const modalRef = useFocusTrap(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-seller-title"
        className="w-full max-w-md rounded-xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl"
      >
        <h3
          id="reject-seller-title"
          className="mb-1 font-mono text-lg font-semibold text-slate-100"
        >
          Verkäufer ablehnen
        </h3>
        <p className="mb-4 text-sm text-slate-500">{seller.companyName}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Ablehnungsgrund..."
          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-700/60 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-700 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Ablehnen
          </button>
        </div>
      </div>
    </div>
  )
}

function SuspendModal({
  seller,
  onClose,
  onDone,
}: {
  seller: AdminSellerListItem
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await AdminService.suspendSellerProfile(seller.id, reason)
      toast.success("Verkäufer gesperrt.")
      onDone()
    } catch {
      toast.error("Fehler beim Sperren.")
    } finally {
      setLoading(false)
    }
  }

  const modalRef = useFocusTrap(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspend-seller-title"
        className="w-full max-w-md rounded-xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl"
      >
        <h3
          id="suspend-seller-title"
          className="mb-1 font-mono text-lg font-semibold text-slate-100"
        >
          Verkäufer sperren
        </h3>
        <p className="mb-4 text-sm text-slate-500">{seller.companyName}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Grund (optional)..."
          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-700/60 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-700 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Sperren
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSellers() {
  const router = useRouter()
  const [sellers, setSellers] = useState<AdminSellerListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<SellerStatus | "">("")
  const [searchQuery, setSearchQuery] = useState("")
  const [rejectTarget, setRejectTarget] = useState<AdminSellerListItem | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<AdminSellerListItem | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await AdminService.listSellers({
        page,
        size: 20,
        status: statusFilter || undefined,
      })
      const items = res.items ?? []
      setSellers(
        searchQuery
          ? items.filter(
              (s) =>
                s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : items
      )
      setTotalPages(res.totalPages ?? 1)
    } catch {
      toast.error("Fehler beim Laden der Verkäufer.")
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    load()
  }, [load])

  const handleApprove = async (seller: AdminSellerListItem) => {
    try {
      await AdminService.approveSellerProfile(seller.id)
      toast.success(`${seller.companyName} genehmigt.`)
      load()
    } catch {
      toast.error("Fehler beim Genehmigen.")
    }
  }

  return (
    <div>
      <PageHeader
        title="Verkäufer-Verwaltung"
        subtitle="Prüfung und Moderation von Verkäuferprofilen"
      />

      <AdminFilterBar>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Firma oder E-Mail suchen..."
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as SellerStatus | "")
            setPage(0)
          }}
          className={ADMIN_SELECT_CLASS}
        >
          <option value="">Alle Status</option>
          {(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as SellerStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </select>
        <RefreshButton onClick={load} />
      </AdminFilterBar>

      <AdminTableContainer
        isLoading={isLoading}
        isEmpty={sellers.length === 0}
        emptyMessage="Keine Verkäufer gefunden."
      >
        <Table>
          <TableHeader className={ADMIN_THEAD_CLASS}>
            <TableRow>
              <TableHead className={ADMIN_TH_CLASS}>Firma</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>E-Mail</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>USt-ID</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Registriert</TableHead>
              <TableHead className={cn(ADMIN_TH_CLASS, "text-right")}>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.map((seller) => (
              <TableRow
                key={seller.id}
                onClick={() => router.push(`/admin/sellers/${seller.id}`)}
                className={ADMIN_TR_CLICKABLE_CLASS}
              >
                <TableCell className="px-4 py-3 font-medium text-slate-200">
                  {seller.companyName}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-400">
                  {seller.userEmail ?? "–"}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-500">{seller.vatId ?? "–"}</TableCell>
                <TableCell className="px-4 py-3">
                  <StatusBadge
                    label={statusLabel[seller.status]}
                    colorClasses={statusColor[seller.status]}
                  />
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-500">
                  {new Date(seller.createdAt).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {seller.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApprove(seller)}
                          className="rounded-lg p-1.5 text-emerald-500 transition-colors hover:bg-emerald-900/40"
                          title="Genehmigen"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setRejectTarget(seller)}
                          className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-900/40"
                          title="Ablehnen"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {seller.status === "APPROVED" && (
                      <button
                        onClick={() => setSuspendTarget(seller)}
                        className="rounded-lg p-1.5 text-orange-500 transition-colors hover:bg-orange-900/40"
                        title="Sperren"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    )}
                    {seller.status === "SUSPENDED" && (
                      <button
                        onClick={() => handleApprove(seller)}
                        className="rounded-lg p-1.5 text-emerald-500 transition-colors hover:bg-emerald-900/40"
                        title="Entsperren"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <AdminTablePagination
          page={page + 1}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p - 1)}
        />
      </AdminTableContainer>

      {rejectTarget && (
        <RejectModal
          seller={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => {
            setRejectTarget(null)
            load()
          }}
        />
      )}
      {suspendTarget && (
        <SuspendModal
          seller={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onDone={() => {
            setSuspendTarget(null)
            load()
          }}
        />
      )}
    </div>
  )
}
