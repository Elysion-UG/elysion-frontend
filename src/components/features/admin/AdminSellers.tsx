"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  XCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import { AdminService } from "@/src/services/admin.service"
import type { AdminSellerListItem, SellerStatus } from "@/src/types"
import { toast } from "sonner"

const statusLabel: Record<SellerStatus, string> = {
  PENDING: "Ausstehend",
  APPROVED: "Genehmigt",
  REJECTED: "Abgelehnt",
  SUSPENDED: "Gesperrt",
}

const statusColor: Record<SellerStatus, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  APPROVED: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  REJECTED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  SUSPENDED: "bg-slate-800 text-slate-500",
}

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
                s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-slate-100">
          Verkäufer-Verwaltung
        </h1>
        <p className="mt-1 text-sm text-slate-500">Prüfung und Moderation von Verkäuferprofilen</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Firma oder E-Mail suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as SellerStatus | "")
            setPage(0)
          }}
          className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
        >
          <option value="">Alle Status</option>
          {(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as SellerStatus[]).map((s) => (
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
        ) : sellers.length === 0 ? (
          <div className="py-16 text-center text-slate-500">Keine Verkäufer gefunden.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800/60 bg-slate-800/30">
              <tr>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Firma
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  E-Mail
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  USt-ID
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Registriert
                </th>
                <th className="px-4 py-3 text-right font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sellers.map((seller) => (
                <tr
                  key={seller.id}
                  onClick={() => router.push(`/admin/sellers/${seller.id}`)}
                  className="cursor-pointer transition-colors hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3 font-medium text-slate-200">{seller.companyName}</td>
                  <td className="px-4 py-3 text-slate-400">{seller.userEmail ?? "–"}</td>
                  <td className="px-4 py-3 text-slate-500">{seller.vatId ?? "–"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[seller.status]}`}
                    >
                      {statusLabel[seller.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(seller.createdAt).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
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
