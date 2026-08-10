"use client"

import { useState } from "react"
import { Plus, Award, RefreshCw, Loader2, ExternalLink } from "lucide-react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import { useSellerCertificates, useCreateSellerCertificate } from "@/src/hooks/useSellerDashboard"
import { isSafeHttpUrl, safeHttpUrl } from "@/src/lib/safe-url"
import type { CertificateType } from "@/src/types"
import { toast } from "sonner"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { StatusBadge } from "@/src/components/shared"
import { certStatusLabel, certStatusColor, CERT_TYPES } from "./sellerDashboard.constants"

// ── CertForm Modal ───────────────────────────────────────────────────────────

function CertForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [certType, setCertType] = useState<CertificateType>("ORGANIC")
  const [title, setTitle] = useState("")
  const [issuerName, setIssuerName] = useState("")
  const [certNumber, setCertNumber] = useState("")
  const [documentUrl, setDocumentUrl] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [notes, setNotes] = useState("")
  const createCert = useCreateSellerCertificate()

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Bitte Titel eingeben.")
      return
    }
    if (!issuerName.trim()) {
      toast.error("Bitte Aussteller eingeben.")
      return
    }
    if (!documentUrl.trim()) {
      toast.error("Bitte Dokument-URL eingeben.")
      return
    }
    if (!isSafeHttpUrl(documentUrl.trim())) {
      toast.error("Dokument-URL muss mit http:// oder https:// beginnen.")
      return
    }
    createCert.mutate(
      {
        certificateType: certType,
        title: title.trim(),
        issuerName: issuerName.trim(),
        certificateNumber: certNumber.trim() || undefined,
        documentUrl: documentUrl.trim(),
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: onSaved }
    )
  }

  const modalRef = useFocusTrap(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-form-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h3 id="cert-form-title" className="mb-4 text-lg font-semibold text-foreground">
          Neues Zertifikat
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Typ</label>
            <select
              value={certType}
              onChange={(e) => setCertType(e.target.value as CertificateType)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
            <label className="mb-1 block text-xs font-medium text-foreground">Titel *</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. EU Bio-Siegel"
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Aussteller *</label>
              <Input
                type="text"
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
                placeholder="z.B. DE-ÖKO-001"
                className="text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Zertifikatnr.
              </label>
              <Input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="Nr."
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Dokument-URL *</label>
            <Input
              type="url"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="https://example.com/zertifikat.pdf"
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Ausstellungsdatum
              </label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Ablaufdatum</label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Notizen</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={createCert.isPending} className="flex-1">
            {createCert.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Erstellen
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Certificates Tab ─────────────────────────────────────────────────────────

export default function SellerCertificatesTab() {
  const { data: certs = [], isFetching, refetch } = useSellerCertificates()
  const [showCertForm, setShowCertForm] = useState(false)

  return (
    <>
      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Meine Zertifikate</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Nachhaltigkeitsnachweise für Ihre Produkte
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void refetch()}
              className="text-muted-foreground transition-colors hover:text-foreground"
              title="Aktualisieren"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
            <Button onClick={() => setShowCertForm(true)}>
              <Plus className="h-4 w-4" /> Zertifikat hinzufügen
            </Button>
          </div>
        </div>

        {isFetching && certs.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : certs.length === 0 ? (
          <div className="py-12 text-center">
            <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">Noch keine Zertifikate</h3>
            <p className="mb-4 text-muted-foreground">
              Fügen Sie Nachhaltigkeitszertifikate hinzu, um Ihre Produkte zu qualifizieren.
            </p>
            <Button onClick={() => setShowCertForm(true)}>Erstes Zertifikat hinzufügen</Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {certs.map((cert) => {
              const safeDocumentUrl = safeHttpUrl(cert.documentUrl)
              return (
                <div key={cert.id} className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{cert.title}</p>
                      <StatusBadge
                        label={certStatusLabel[cert.status]}
                        colorClasses={certStatusColor[cert.status]}
                      />
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground">
                        {cert.certificateType}
                      </span>
                    </div>
                    {cert.issuerName && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{cert.issuerName}</p>
                    )}
                    {cert.rejectionReason && (
                      <p className="mt-1 text-xs text-danger">Abgelehnt: {cert.rejectionReason}</p>
                    )}
                    {cert.expiryDate && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Gültig bis: {new Date(cert.expiryDate).toLocaleDateString("de-DE")}
                      </p>
                    )}
                    {safeDocumentUrl && (
                      <a
                        href={safeDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-600"
                      >
                        <ExternalLink className="h-3 w-3" /> Dokument ansehen
                      </a>
                    )}
                    {cert.status === "VERIFIED" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Zum Produkt verknüpfen: Produktbearbeitung → Zertifikate
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCertForm && (
        <CertForm onClose={() => setShowCertForm(false)} onSaved={() => setShowCertForm(false)} />
      )}
    </>
  )
}
