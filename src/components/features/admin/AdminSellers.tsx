"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Ban, Loader2 } from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminSellerListItem, SellerStatus } from "@/src/types"
import {
  ADMIN_SELLER_STATUS_LABEL as statusLabel,
  ADMIN_SELLER_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import {
  AdminListPage,
  SearchInput,
  RefreshButton,
  GenericRejectModal,
  ADMIN_SELECT_CLASS,
} from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
import { TableCell } from "@/src/components/ui/table"
import { useAdminList } from "@/src/hooks/useAdminList"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Textarea } from "@/src/components/ui/textarea"
import { toast } from "sonner"

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      {/* `dark` re-skopt die Portal-Tokens auf Ink-Dark; sonst Light-Text ~3:1 (Issue #140). */}
      <DialogContent className="dark max-w-md rounded-xl border border-border/60 bg-ink-900 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg font-semibold text-muted-foreground">
            Verkäufer sperren
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {seller.companyName}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Grund (optional)..."
          className="border-border/60 bg-ink-900/60 text-sm text-muted-foreground"
        />
        <DialogFooter className="mt-4 flex gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border/60 text-muted-foreground hover:bg-ink-900/60"
          >
            Abbrechen
          </Button>
          <Button
            variant="secondary"
            onClick={handleSubmit}
            disabled={loading}
            // Warnung #C98A1E trägt ein Ink-Label — Weiß darauf sind nur 2,6:1 (WCAG-AA verfehlt).
            className="flex-1 bg-warning text-ink-900 hover:bg-warning/90 disabled:opacity-60 [&_svg]:size-3"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Sperren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminSellers() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<SellerStatus | "">("")
  const [searchQuery, setSearchQuery] = useState("")
  const [rejectTarget, setRejectTarget] = useState<AdminSellerListItem | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<AdminSellerListItem | null>(null)

  const fetchPage = useCallback(
    async (page: number) => {
      const res = await AdminService.listSellers({
        page,
        size: 20,
        status: statusFilter || undefined,
      })
      const items = res.items ?? []
      return {
        items: searchQuery
          ? items.filter(
              (s) =>
                s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : items,
        totalPages: res.totalPages ?? 1,
      }
    },
    [statusFilter, searchQuery]
  )

  const { items, isLoading, page, totalPages, setPage, reload } = useAdminList({
    fetchPage,
    errorMessage: "Fehler beim Laden der Verkäufer.",
  })

  const handleApprove = async (seller: AdminSellerListItem) => {
    try {
      await AdminService.approveSellerProfile(seller.id)
      toast.success(`${seller.companyName} genehmigt.`)
      reload()
    } catch {
      toast.error("Fehler beim Genehmigen.")
    }
  }

  return (
    <AdminListPage<AdminSellerListItem>
      title="Verkäufer-Verwaltung"
      subtitle="Prüfung und Moderation von Verkäuferprofilen"
      filters={
        <>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Firma oder E-Mail suchen..."
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as SellerStatus | "")
              setPage(0)
            }}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="">Alle Status</option>
            {(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as SellerStatus[]).map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
          <RefreshButton onClick={reload} />
        </>
      }
      columns={[
        { header: "Firma", key: "company" },
        { header: "E-Mail", key: "email" },
        { header: "USt-ID", key: "vatId" },
        { header: "Status", key: "status" },
        { header: "Registriert", key: "registered" },
        { header: "Aktionen", key: "actions", className: "text-right" },
      ]}
      rows={items}
      isLoading={isLoading}
      emptyMessage="Keine Verkäufer gefunden."
      getRowKey={(seller) => seller.id}
      onRowClick={(seller) => router.push(`/admin/sellers/${seller.id}`)}
      renderRow={(seller) => (
        <>
          <TableCell className="px-4 py-3 font-medium text-muted-foreground">
            {seller.companyName}
          </TableCell>
          <TableCell className="px-4 py-3 text-muted-foreground">
            {seller.userEmail ?? "–"}
          </TableCell>
          <TableCell className="px-4 py-3 text-muted-foreground">{seller.vatId ?? "–"}</TableCell>
          <TableCell className="px-4 py-3">
            <StatusBadge
              label={statusLabel[seller.status]}
              colorClasses={statusColor[seller.status]}
            />
          </TableCell>
          <TableCell className="px-4 py-3 text-muted-foreground">
            {new Date(seller.createdAt).toLocaleDateString("de-DE")}
          </TableCell>
          <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-2">
              {seller.status === "PENDING" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleApprove(seller)}
                    className="h-7 w-7 text-green-500 hover:bg-green-700/40 hover:text-green-500"
                    title="Genehmigen"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRejectTarget(seller)}
                    className="h-7 w-7 text-danger hover:bg-destructive/40 hover:text-danger"
                    title="Ablehnen"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
              {seller.status === "APPROVED" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSuspendTarget(seller)}
                  className="h-7 w-7 text-warning hover:bg-warning/40 hover:text-warning"
                  title="Sperren"
                >
                  <Ban className="h-4 w-4" />
                </Button>
              )}
              {seller.status === "SUSPENDED" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleApprove(seller)}
                  className="h-7 w-7 text-green-500 hover:bg-green-700/40 hover:text-green-500"
                  title="Entsperren"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TableCell>
        </>
      )}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
    >
      {rejectTarget && (
        <GenericRejectModal
          title="Verkäufer ablehnen"
          description={rejectTarget.companyName}
          onSubmit={async (reason) => {
            await AdminService.rejectSellerProfile(rejectTarget.id, reason)
            toast.success("Verkäufer abgelehnt.")
            setRejectTarget(null)
            reload()
          }}
          onClose={() => setRejectTarget(null)}
        />
      )}
      {suspendTarget && (
        <SuspendModal
          seller={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onDone={() => {
            setSuspendTarget(null)
            reload()
          }}
        />
      )}
    </AdminListPage>
  )
}
