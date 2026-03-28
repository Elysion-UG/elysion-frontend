"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle2,
  XCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react"
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
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-slate-100 text-slate-600",
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-semibold text-slate-800">Verkäufer ablehnen</h3>
        <p className="mb-4 text-sm text-slate-500">{seller.companyName}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Ablehnungsgrund..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-semibold text-slate-800">Verkäufer sperren</h3>
        <p className="mb-4 text-sm text-slate-500">{seller.companyName}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Grund (optional)..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-600 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Sperren
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSellers() {
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Verkäufer-Verwaltung</h1>
          <p className="mt-1 text-sm text-slate-500">
            Prüfung und Moderation von Verkäuferprofilen
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Firma oder E-Mail suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as SellerStatus | "")
              setPage(0)
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          ) : sellers.length === 0 ? (
            <div className="py-16 text-center text-slate-500">Keine Verkäufer gefunden.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Firma</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">E-Mail</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">USt-ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Registriert</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map((seller) => (
                  <tr key={seller.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{seller.companyName}</td>
                    <td className="px-4 py-3 text-slate-600">{seller.user?.email ?? "–"}</td>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/admin/sellers/${seller.userId}`}
                          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-600"
                          title="Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        {seller.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(seller)}
                              className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                              title="Genehmigen"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setRejectTarget(seller)}
                              className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                              title="Ablehnen"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {seller.status === "APPROVED" && (
                          <button
                            onClick={() => setSuspendTarget(seller)}
                            className="rounded-lg p-1.5 text-orange-600 transition-colors hover:bg-orange-50"
                            title="Sperren"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {seller.status === "SUSPENDED" && (
                          <button
                            onClick={() => handleApprove(seller)}
                            className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
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
