"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, XCircle, RefreshCw, Loader2, ExternalLink } from "lucide-react"
import { CertificateService } from "@/src/services/certificate.service"
import type { Certificate, CertificateStatus } from "@/src/types"
import { toast } from "sonner"

const statusLabel: Record<CertificateStatus, string> = {
  PENDING: "Ausstehend",
  VERIFIED: "Verifiziert",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
}

const statusColor: Record<CertificateStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-500",
}

function RejectModal({ cert, onClose, onDone }: { cert: Certificate; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) { toast.error("Bitte Ablehnungsgrund angeben."); return }
    setLoading(true)
    try {
      await CertificateService.reject(cert.id, reason)
      toast.success("Zertifikat abgelehnt.")
      onDone()
    } catch { toast.error("Fehler beim Ablehnen.") }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Zertifikat ablehnen</h3>
        <p className="text-sm text-slate-500 mb-4">{cert.title}</p>
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

export default function AdminCertificates() {
  const [certs, setCerts] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<CertificateStatus | "">("")
  const [rejectTarget, setRejectTarget] = useState<Certificate | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const all = await CertificateService.listAll()
      setCerts(filter ? all.filter(c => c.status === filter) : all)
    } catch { toast.error("Fehler beim Laden der Zertifikate.") }
    finally { setIsLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleVerify = async (cert: Certificate) => {
    try {
      await CertificateService.verify(cert.id)
      toast.success(`"${cert.title}" verifiziert.`)
      load()
    } catch { toast.error("Fehler beim Verifizieren.") }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Zertifikat-Prüfung</h1>
          <p className="text-slate-500 text-sm mt-1">Nachhaltigkeitszertifikate prüfen und freigeben</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as CertificateStatus | "")}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">Alle Status</option>
            {(["PENDING", "VERIFIED", "REJECTED", "EXPIRED"] as CertificateStatus[]).map(s => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </select>
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-2">
            <RefreshCw className="w-4 h-4" /> Aktualisieren
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : certs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">Keine Zertifikate gefunden.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Titel</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Typ</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Aussteller</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Gültig bis</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Dokument</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certs.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{cert.title}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{cert.certificateType}</td>
                    <td className="px-4 py-3 text-slate-500">{cert.issuerName ?? "–"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[cert.status]}`}>
                        {statusLabel[cert.status]}
                      </span>
                      {cert.rejectionReason && (
                        <p className="text-xs text-red-500 mt-0.5">{cert.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-sm">
                      {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString("de-DE") : "–"}
                    </td>
                    <td className="px-4 py-3">
                      {cert.documentUrl ? (
                        <a
                          href={cert.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-xs"
                        >
                          <ExternalLink className="w-3 h-3" /> Dokument
                        </a>
                      ) : <span className="text-slate-400 text-xs">–</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {cert.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleVerify(cert)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Verifizieren"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectTarget(cert)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Ablehnen"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {rejectTarget && (
        <RejectModal
          cert={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => { setRejectTarget(null); load() }}
        />
      )}
    </div>
  )
}
