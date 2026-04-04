"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react"
import { CertificateService } from "@/src/services/certificate.service"
import type { Certificate, CertificateStatus } from "@/src/types"
import {
  ADMIN_CERTIFICATE_STATUS_LABEL as statusLabel,
  ADMIN_CERTIFICATE_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import {
  PageHeader,
  AdminFilterBar,
  RefreshButton,
  AdminTableContainer,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog"
import { Textarea } from "@/src/components/ui/textarea"
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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg font-semibold text-slate-100">
            Zertifikat ablehnen
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">{cert.title}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Ablehnungsgrund..."
          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
        />
        <DialogFooter className="mt-4 flex gap-3 sm:flex-row">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminCertificates() {
  const router = useRouter()
  const [certs, setCerts] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<CertificateStatus | "">("")
  const [rejectTarget, setRejectTarget] = useState<Certificate | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const all = await CertificateService.adminListAll()
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
      <PageHeader
        title="Zertifikat-Prüfung"
        subtitle="Nachhaltigkeitszertifikate prüfen und freigeben"
      />

      <AdminFilterBar>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as CertificateStatus | "")}
          className={ADMIN_SELECT_CLASS}
        >
          <option value="">Alle Status</option>
          {(["PENDING", "VERIFIED", "REJECTED", "EXPIRED"] as CertificateStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </select>
        <RefreshButton onClick={load} />
      </AdminFilterBar>

      <AdminTableContainer
        isLoading={isLoading}
        isEmpty={certs.length === 0}
        emptyMessage="Keine Zertifikate gefunden."
      >
        <Table>
          <TableHeader className={ADMIN_THEAD_CLASS}>
            <TableRow>
              <TableHead className={ADMIN_TH_CLASS}>Titel</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Typ</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Aussteller</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Gültig bis</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Dokument</TableHead>
              <TableHead className={cn(ADMIN_TH_CLASS, "text-right")}>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certs.map((cert) => (
              <TableRow
                key={cert.id}
                onClick={() => router.push(`/admin/certificates/${cert.id}`)}
                className={ADMIN_TR_CLICKABLE_CLASS}
              >
                <TableCell className="px-4 py-3 font-medium text-slate-200">{cert.title}</TableCell>
                <TableCell className="px-4 py-3 text-xs text-slate-500">
                  {cert.certificateType}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-500">{cert.issuerName ?? "–"}</TableCell>
                <TableCell className="px-4 py-3">
                  <StatusBadge
                    label={statusLabel[cert.status]}
                    colorClasses={statusColor[cert.status]}
                  />
                  {cert.rejectionReason && (
                    <p className="mt-0.5 text-xs text-red-400">{cert.rejectionReason}</p>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-500">
                  {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString("de-DE") : "–"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {cert.documentUrl ? (
                    <a
                      href={cert.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-cyber-500 hover:text-cyber-400"
                    >
                      <ExternalLink className="h-3 w-3" /> Dokument
                    </a>
                  ) : (
                    <span className="text-xs text-slate-600">–</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {cert.status === "PENDING" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVerify(cert)
                          }}
                          className="rounded-lg p-1.5 text-emerald-500 transition-colors hover:bg-emerald-900/40"
                          title="Verifizieren"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setRejectTarget(cert)
                          }}
                          className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-900/40"
                          title="Ablehnen"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableContainer>

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
