"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, ExternalLink, AlertTriangle } from "lucide-react"
import { CertificateService } from "@/src/services/certificate.service"
import { safeHttpUrl } from "@/src/lib/safe-url"
import type { Certificate, CertificateStatus } from "@/src/types"
import {
  ADMIN_CERTIFICATE_STATUS_LABEL as statusLabel,
  ADMIN_CERTIFICATE_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import {
  AdminListPage,
  RefreshButton,
  GenericRejectModal,
  ADMIN_SELECT_CLASS,
} from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
import { Button } from "@/src/components/ui/button"
import { TableCell } from "@/src/components/ui/table"
import { useAdminList } from "@/src/hooks/useAdminList"
import { toast } from "sonner"

export default function AdminCertificates() {
  const router = useRouter()
  const [filter, setFilter] = useState<CertificateStatus | "">("")
  const [rejectTarget, setRejectTarget] = useState<Certificate | null>(null)

  // CertificateService.adminListAll returns the full array (no server-side
  // pagination); wrap it as a single page so the shared list scaffold applies.
  const fetchPage = useCallback(async () => {
    const all = await CertificateService.adminListAll()
    return {
      items: filter ? all.filter((c) => c.status === filter) : all,
      totalPages: 1,
    }
  }, [filter])

  const { items, isLoading, page, totalPages, reload } = useAdminList({
    fetchPage,
    errorMessage: "Fehler beim Laden der Zertifikate.",
  })

  const handleVerify = async (cert: Certificate) => {
    try {
      await CertificateService.verify(cert.id)
      toast.success(`"${cert.title}" verifiziert.`)
      reload()
    } catch {
      toast.error("Fehler beim Verifizieren.")
    }
  }

  return (
    <AdminListPage<Certificate>
      title="Zertifikat-Prüfung"
      subtitle="Nachhaltigkeitszertifikate prüfen und freigeben"
      filters={
        <>
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
          <RefreshButton onClick={reload} />
        </>
      }
      columns={[
        { header: "Titel", key: "title" },
        { header: "Typ", key: "type" },
        { header: "Aussteller", key: "issuer" },
        { header: "Status", key: "status" },
        { header: "Gültig bis", key: "expiry" },
        { header: "Dokument", key: "document" },
        { header: "Aktionen", key: "actions", className: "text-right" },
      ]}
      rows={items}
      isLoading={isLoading}
      emptyMessage="Keine Zertifikate gefunden."
      getRowKey={(cert) => cert.id}
      onRowClick={(cert) => router.push(`/admin/certificates/${cert.id}`)}
      renderRow={(cert) => {
        const safeDocumentUrl = safeHttpUrl(cert.documentUrl)
        return (
          <>
            <TableCell className="px-4 py-3 font-medium text-muted-foreground">
              {cert.title}
            </TableCell>
            <TableCell className="px-4 py-3 text-xs text-muted-foreground">
              {cert.certificateType}
            </TableCell>
            <TableCell className="px-4 py-3 text-muted-foreground">
              {cert.issuerName ?? "–"}
            </TableCell>
            <TableCell className="px-4 py-3">
              <StatusBadge
                label={statusLabel[cert.status]}
                colorClasses={statusColor[cert.status]}
              />
              {cert.rejectionReason && (
                <p className="mt-0.5 text-xs text-danger">{cert.rejectionReason}</p>
              )}
            </TableCell>
            <TableCell className="px-4 py-3 text-sm text-muted-foreground">
              {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString("de-DE") : "–"}
            </TableCell>
            <TableCell className="px-4 py-3">
              {safeDocumentUrl ? (
                <a
                  href={safeDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-green-500 hover:text-green-500"
                >
                  <ExternalLink className="h-3 w-3" /> Dokument
                </a>
              ) : cert.documentUrl ? (
                <span
                  className="inline-flex items-center gap-1 text-xs text-warning"
                  title="Unsichere URL — kein Link"
                >
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  unsichere URL
                </span>
              ) : (
                <span className="text-xs text-foreground">–</span>
              )}
            </TableCell>
            <TableCell className="px-4 py-3">
              <div className="flex items-center justify-end gap-2">
                {cert.status === "PENDING" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVerify(cert)
                      }}
                      className="h-7 w-7 text-green-500 hover:bg-green-700/40 hover:text-green-500"
                      title="Verifizieren"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setRejectTarget(cert)
                      }}
                      className="h-7 w-7 text-danger hover:bg-destructive/40 hover:text-danger"
                      title="Ablehnen"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </>
        )
      }}
      page={page}
      totalPages={totalPages}
      onPageChange={() => {}}
    >
      {rejectTarget && (
        <GenericRejectModal
          title="Zertifikat ablehnen"
          description={rejectTarget.title}
          onSubmit={async (reason) => {
            await CertificateService.reject(rejectTarget.id, reason)
            toast.success("Zertifikat abgelehnt.")
            setRejectTarget(null)
            reload()
          }}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </AdminListPage>
  )
}
