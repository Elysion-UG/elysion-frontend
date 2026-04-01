"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Award, RefreshCw, Loader2, ExternalLink } from "lucide-react"
import { CertificateService } from "@/src/services/certificate.service"
import type { Certificate, CertificateType } from "@/src/types"
import { toast } from "sonner"
import { certStatusLabel, certStatusColor, CERT_TYPES } from "./sellerDashboard.constants"

// ── CertForm Modal ───────────────────────────────────────────────────────────

function CertForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [certType, setCertType] = useState<CertificateType>("ORGANIC")
  const [title, setTitle] = useState("")
  const [issuerName, setIssuerName] = useState("")
  const [certNumber, setCertNumber] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Bitte Titel eingeben.")
      return
    }
    setIsSaving(true)
    try {
      await CertificateService.create({
        certificateType: certType,
        title: title.trim(),
        issuerName: issuerName.trim() || undefined,
        certificateNumber: certNumber.trim() || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
      })
      toast.success("Zertifikat erstellt und zur Prüfung eingereicht.")
      onSaved()
    } catch {
      toast.error("Fehler beim Erstellen.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Neues Zertifikat</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Typ</label>
            <select
              value={certType}
              onChange={(e) => setCertType(e.target.value as CertificateType)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CERT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="OTHER">Sonstige</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. EU Bio-Siegel"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Aussteller</label>
              <input
                type="text"
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
                placeholder="z.B. DE-ÖKO-001"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Zertifikatnr.</label>
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="Nr."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Ausstellungsdatum
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Ablaufdatum</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Notizen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-3 w-3 animate-spin" />} Erstellen
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Certificates Tab ─────────────────────────────────────────────────────────

export default function SellerCertificatesTab() {
  const [certs, setCerts] = useState<Certificate[]>([])
  const [certsLoading, setCertsLoading] = useState(false)
  const [showCertForm, setShowCertForm] = useState(false)

  const fetchCerts = useCallback(async () => {
    setCertsLoading(true)
    try {
      const data = await CertificateService.list()
      setCerts(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Zertifikate konnten nicht geladen werden.")
    } finally {
      setCertsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCerts()
  }, [fetchCerts])

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Meine Zertifikate</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Nachhaltigkeitsnachweise für Ihre Produkte
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCerts}
              className="text-slate-400 transition-colors hover:text-slate-600"
              title="Aktualisieren"
            >
              <RefreshCw className={`h-4 w-4 ${certsLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowCertForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" /> Zertifikat hinzufügen
            </button>
          </div>
        </div>

        {certsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : certs.length === 0 ? (
          <div className="py-12 text-center">
            <Award className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="mb-2 text-lg font-semibold text-slate-800">Noch keine Zertifikate</h3>
            <p className="mb-4 text-slate-500">
              Fügen Sie Nachhaltigkeitszertifikate hinzu, um Ihre Produkte zu qualifizieren.
            </p>
            <button
              onClick={() => setShowCertForm(true)}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Erstes Zertifikat hinzufügen
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {certs.map((cert) => (
              <div key={cert.id} className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100">
                  <Award className="h-5 w-5 text-teal-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-800">{cert.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${certStatusColor[cert.status]}`}
                    >
                      {certStatusLabel[cert.status]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {cert.certificateType}
                    </span>
                  </div>
                  {cert.issuerName && (
                    <p className="mt-0.5 text-sm text-slate-500">{cert.issuerName}</p>
                  )}
                  {cert.rejectionReason && (
                    <p className="mt-1 text-xs text-red-600">Abgelehnt: {cert.rejectionReason}</p>
                  )}
                  {cert.expiryDate && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      Gültig bis: {new Date(cert.expiryDate).toLocaleDateString("de-DE")}
                    </p>
                  )}
                  {cert.documentUrl && (
                    <a
                      href={cert.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                    >
                      <ExternalLink className="h-3 w-3" /> Dokument ansehen
                    </a>
                  )}
                  {cert.status === "VERIFIED" && (
                    <p className="mt-1 text-xs text-slate-400">
                      Zum Produkt verknüpfen: Produktbearbeitung → Zertifikate
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCertForm && (
        <CertForm
          onClose={() => setShowCertForm(false)}
          onSaved={() => {
            setShowCertForm(false)
            fetchCerts()
          }}
        />
      )}
    </>
  )
}
