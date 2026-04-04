"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Award,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  Hash,
  Building,
} from "lucide-react"
import { CertificateService } from "@/src/services/certificate.service"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import type { Certificate, CertificateStatus } from "@/src/types"
import { toast } from "sonner"

const statusLabel: Record<CertificateStatus, string> = {
  PENDING: "Ausstehend",
  VERIFIED: "Verifiziert",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
}

const statusColor: Record<CertificateStatus, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-700/40",
  VERIFIED: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  REJECTED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  EXPIRED: "bg-slate-800 text-slate-500",
}

const typeLabel: Record<string, string> = {
  ORGANIC: "Bio / Organic",
  FAIR_TRADE: "Fair Trade",
  RECYCLED: "Recycled",
  VEGAN: "Vegan",
}

function formatDate(value?: string | null): string {
  if (!value) return "–"
  return new Date(value).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatDateTime(value?: string | null): string {
  if (!value) return "–"
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  if (!value || value === "–") return null
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm text-slate-200">{value}</p>
      </div>
    </div>
  )
}

function RejectModal({
  certId,
  onClose,
  onDone,
}: {
  certId: string
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const modalRef = useFocusTrap(onClose)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Bitte Ablehnungsgrund angeben.")
      return
    }
    setLoading(true)
    try {
      await CertificateService.reject(certId, reason)
      toast.success("Zertifikat abgelehnt.")
      onDone()
    } catch {
      toast.error("Fehler beim Ablehnen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-cert-title"
        className="w-full max-w-md rounded-xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl"
      >
        <h3 id="reject-cert-title" className="mb-4 font-mono text-lg font-semibold text-slate-100">
          Zertifikat ablehnen
        </h3>
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

export default function AdminCertificateDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [cert, setCert] = useState<Certificate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)

  const load = useCallback(async () => {
    if (!params.id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await CertificateService.adminGetById(params.id)
      setCert(data)
    } catch {
      setError("Zertifikat konnte nicht geladen werden.")
      toast.error("Fehler beim Laden des Zertifikats.")
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  const handleVerify = async () => {
    if (!cert) return
    try {
      await CertificateService.verify(cert.id)
      toast.success("Zertifikat verifiziert.")
      load()
    } catch {
      toast.error("Fehler beim Verifizieren.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
      </div>
    )
  }

  if (error || !cert) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">{error ?? "Zertifikat nicht gefunden."}</p>
        <button
          onClick={() => router.push("/admin/certificates")}
          className="mt-4 text-sm text-cyber-500 hover:text-cyber-400"
        >
          ← Zurück zur Übersicht
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/certificates")}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          title="Zurück"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-mono text-2xl font-bold tracking-wide text-slate-100">
            {cert.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Zertifikat-Details</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[cert.status]}`}>
          {statusLabel[cert.status]}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Certificate Info */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-slate-400">
            <Award className="h-4 w-4 text-cyber-500" />
            Zertifikat-Informationen
          </h2>
          <div className="divide-y divide-slate-800/60">
            <InfoRow icon={Hash} label="ID" value={cert.id} />
            <InfoRow
              icon={Award}
              label="Typ"
              value={typeLabel[cert.certificateType] ?? cert.certificateType}
            />
            <InfoRow
              icon={Building}
              label="Aussteller"
              value={cert.issuerName ?? cert.issuingBody}
            />
            <InfoRow icon={FileText} label="Zertifikatnummer" value={cert.certificateNumber} />
            <InfoRow icon={User} label="Verkäufer-ID" value={cert.sellerId} />
          </div>
        </div>

        {/* Right: Dates & Status */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
            <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-slate-400">
              <Calendar className="h-4 w-4 text-cyber-500" />
              Zeitangaben
            </h2>
            <div className="divide-y divide-slate-800/60">
              <InfoRow
                icon={Calendar}
                label="Ausgestellt am"
                value={formatDate(cert.issueDate ?? cert.validFrom)}
              />
              <InfoRow
                icon={Calendar}
                label="Gültig bis"
                value={formatDate(cert.expiryDate ?? cert.validUntil)}
              />
              <InfoRow icon={Calendar} label="Erstellt" value={formatDateTime(cert.createdAt)} />
              <InfoRow
                icon={Calendar}
                label="Aktualisiert"
                value={formatDateTime(cert.updatedAt)}
              />
            </div>
          </div>

          {/* Moderation Info */}
          {(cert.verifiedAt || cert.rejectedAt) && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
              <h2 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-slate-400">
                Moderation
              </h2>
              <div className="divide-y divide-slate-800/60">
                {cert.verifiedAt && (
                  <>
                    <InfoRow
                      icon={CheckCircle2}
                      label="Verifiziert am"
                      value={formatDateTime(cert.verifiedAt)}
                    />
                    <InfoRow
                      icon={User}
                      label="Verifiziert von (Admin-ID)"
                      value={cert.verifiedByAdminId}
                    />
                  </>
                )}
                {cert.rejectedAt && (
                  <>
                    <InfoRow
                      icon={XCircle}
                      label="Abgelehnt am"
                      value={formatDateTime(cert.rejectedAt)}
                    />
                    <InfoRow
                      icon={User}
                      label="Abgelehnt von (Admin-ID)"
                      value={cert.rejectedByAdminId}
                    />
                  </>
                )}
                {cert.rejectionReason && (
                  <InfoRow icon={FileText} label="Ablehnungsgrund" value={cert.rejectionReason} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {cert.notes && (
        <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
          <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-slate-400">
            Notizen
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{cert.notes}</p>
        </div>
      )}

      {/* Document */}
      {cert.documentUrl && (
        <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
          <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-slate-400">
            Dokument
          </h2>
          <a
            href={cert.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-cyber-800/60 bg-cyber-950/40 px-4 py-2.5 text-sm font-medium text-cyber-400 transition-colors hover:bg-cyber-900/40 hover:text-cyber-300"
          >
            <ExternalLink className="h-4 w-4" />
            Dokument öffnen
          </a>
        </div>
      )}

      {/* Actions */}
      {cert.status === "PENDING" && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleVerify}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          >
            <CheckCircle2 className="h-4 w-4" />
            Verifizieren
          </button>
          <button
            onClick={() => setRejectOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            <XCircle className="h-4 w-4" />
            Ablehnen
          </button>
        </div>
      )}

      {rejectOpen && (
        <RejectModal
          certId={cert.id}
          onClose={() => setRejectOpen(false)}
          onDone={() => {
            setRejectOpen(false)
            load()
          }}
        />
      )}
    </div>
  )
}
