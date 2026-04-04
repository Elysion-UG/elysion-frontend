"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, XCircle, RefreshCw, Loader2, ExternalLink } from "lucide-react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import { CertificateService } from "@/src/services/certificate.service"
import type { Certificate, CertificateStatus } from "@/src/types"
import {
  ADMIN_CERTIFICATE_STATUS_LABEL as statusLabel,
  ADMIN_CERTIFICATE_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import { toast } from "sonner"

function RejectModal({
  cert,
  onClose,
  onDone,
}: {
  cert: Certificate
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
      await CertificateService.reject(cert.id, reason)
      toast.success("Zertifikat abgelehnt.")
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
        aria-labelledby="reject-cert-title"
        className="w-full max-w-md rounded-xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl"
      >
        <h3 id="reject-cert-title" className="mb-1 font-mono text-lg font-semibold text-slate-100">
          Zertifikat ablehnen
        </h3>
        <p className="mb-4 text-sm text-slate-500">{cert.title}</p>
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

export default function AdminCertificates() {
  const [certs, setCerts] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<CertificateStatus | "">("")
  const [rejectTarget, setRejectTarget] = useState<Certificate | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const all = await CertificateService.listAll()
      setCerts(filter ? all.filter((c) => c.status === filter) : all)
    } catch {
      toast.error("Fehler beim Laden der Zertifikate.")
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const handleVerify = async (cert: Certificate) => {
    try {
      await CertificateService.verify(cert.id)
      toast.success(`"${cert.title}" verifiziert.`)
      load()
    } catch {
      toast.error("Fehler beim Verifizieren.")
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-slate-100">
          Zertifikat-Prüfung
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Nachhaltigkeitszertifikate prüfen und freigeben
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as CertificateStatus | "")}
          className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
        >
          <option value="">Alle Status</option>
          {(["PENDING", "VERIFIED", "REJECTED", "EXPIRED"] as CertificateStatus[]).map((s) => (
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

      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/60">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
          </div>
        ) : certs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">Keine Zertifikate gefunden.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800/60 bg-slate-800/30">
              <tr>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Titel
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Typ
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Aussteller
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Gültig bis
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Dokument
                </th>
                <th className="px-4 py-3 text-right font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {certs.map((cert) => (
                <tr key={cert.id} className="transition-colors hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-slate-200">{cert.title}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{cert.certificateType}</td>
                  <td className="px-4 py-3 text-slate-500">{cert.issuerName ?? "–"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[cert.status]}`}
                    >
                      {statusLabel[cert.status]}
                    </span>
                    {cert.rejectionReason && (
                      <p className="mt-0.5 text-xs text-red-400">{cert.rejectionReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString("de-DE") : "–"}
                  </td>
                  <td className="px-4 py-3">
                    {cert.documentUrl ? (
                      <a
                        href={cert.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-cyber-500 hover:text-cyber-400"
                      >
                        <ExternalLink className="h-3 w-3" /> Dokument
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {cert.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleVerify(cert)}
                            className="rounded-lg p-1.5 text-emerald-500 transition-colors hover:bg-emerald-900/40"
                            title="Verifizieren"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setRejectTarget(cert)}
                            className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-900/40"
                            title="Ablehnen"
                          >
                            <XCircle className="h-4 w-4" />
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

      {rejectTarget && (
        <RejectModal
          cert={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => {
            setRejectTarget(null)
            load()
          }}
        />
      )}
    </div>
  )
}
