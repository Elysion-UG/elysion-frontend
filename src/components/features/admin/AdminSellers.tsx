"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, XCircle, Ban, ChevronLeft, ChevronRight, Search, Loader2, RefreshCw, Eye } from "lucide-react"
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

function RejectModal({ seller, onClose, onDone }: { seller: AdminSellerListItem; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) { toast.error("Bitte Ablehnungsgrund angeben."); return }
    setLoading(true)
    try {
      await AdminService.rejectSellerProfile(seller.id, reason)
      toast.success("Verkäufer abgelehnt.")
      onDone()
    } catch { toast.error("Fehler beim Ablehnen.") }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Verkäufer ablehnen</h3>
        <p className="text-sm text-slate-500 mb-4">{seller.companyName}</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Ablehnungsgrund..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Abbrechen</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3 h-3 animate-spin" />} Ablehnen
          </button>
        </div>
      </div>
    </div>
  )
}

function SuspendModal({ seller, onClose, onDone }: { seller: AdminSellerListItem; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await AdminService.suspendSellerProfile(seller.id, reason)
      toast.success("Verkäufer gesperrt.")
      onDone()
    } catch { toast.error("Fehler beim Sperren.") }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Verkäufer sperren</h3>
        <p className="text-sm text-slate-500 mb-4">{seller.companyName}</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Grund (optional)..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Abbrechen</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3 h-3 animate-spin" />} Sperren
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
      const res = await AdminService.listSellers({ page, size: 20, status: statusFilter || undefined })
      const items = res.items ?? []
      setSellers(searchQuery ? items.filter(s =>
        s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      ) : items)
      setTotalPages(res.totalPages ?? 1)
    } catch { toast.error("Fehler beim Laden der Verkäufer.") }
    finally { setIsLoading(false) }
  }, [page, statusFilter, searchQuery])

  useEffect(() => { load() }, [load])

  const handleApprove = async (seller: AdminSellerListItem) => {
    try {
      await AdminService.approveSellerProfile(seller.id)
      toast.success(`${seller.companyName} genehmigt.`)
      load()
    } catch { toast.error("Fehler beim Genehmigen.") }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Verkäufer-Verwaltung</h1>
          <p className="text-slate-500 text-sm mt-1">Prüfung und Moderation von Verkäuferprofilen</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Firma oder E-Mail suchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as SellerStatus | ""); setPage(0) }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Alle Status</option>
            {(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as SellerStatus[]).map(s => (
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
          ) : sellers.length === 0 ? (
            <div className="text-center py-16 text-slate-500">Keine Verkäufer gefunden.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Firma</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">E-Mail</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">USt-ID</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Registriert</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map(seller => (
                  <tr key={seller.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{seller.companyName}</td>
                    <td className="px-4 py-3 text-slate-600">{seller.user?.email ?? "–"}</td>
                    <td className="px-4 py-3 text-slate-500">{seller.vatId ?? "–"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[seller.status]}`}>
                        {statusLabel[seller.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(seller.createdAt).toLocaleDateString("de-DE")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/admin/sellers/${seller.userId}`}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        {seller.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(seller)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Genehmigen"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectTarget(seller)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Ablehnen"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {seller.status === "APPROVED" && (
                          <button
                            onClick={() => setSuspendTarget(seller)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Sperren"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {seller.status === "SUSPENDED" && (
                          <button
                            onClick={() => handleApprove(seller)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Entsperren"
                          >
                            <CheckCircle2 className="w-4 h-4" />
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

      {rejectTarget && (
        <RejectModal
          seller={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => { setRejectTarget(null); load() }}
        />
      )}
      {suspendTarget && (
        <SuspendModal
          seller={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onDone={() => { setSuspendTarget(null); load() }}
        />
      )}
    </div>
  )
}
