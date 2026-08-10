"use client"

import { useState } from "react"
import {
  PageHeader,
  AdminFilterBar,
  AdminTableContainer,
  AdminTablePagination,
  RefreshButton,
  ADMIN_SELECT_CLASS,
  ADMIN_TH_CLASS,
  ADMIN_THEAD_CLASS,
  ADMIN_TR_CLICKABLE_CLASS,
} from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table"
import { cn } from "@/src/lib/utils"
import {
  DUPLICATE_CONFIDENCE_COLOR,
  DUPLICATE_CONFIDENCE_LABEL,
  DUPLICATE_RESOLUTION_COLOR,
  DUPLICATE_RESOLUTION_LABEL,
  duplicateBuyerLabel,
  duplicateConfidence,
  formatSecondsApart,
  isDuplicateDecided,
  orderRefLabel,
} from "@/src/lib/order-duplicate"
import {
  useOrderDuplicateStats,
  useOrderDuplicates,
  useResolveOrderDuplicate,
} from "@/src/hooks/useAdminOrderDuplicates"
import type { OrderDuplicateFlag, OrderDuplicateFlagStatus } from "@/src/types"
import DuplicateScopeNotice from "./order-duplicates/DuplicateScopeNotice"
import DuplicateStatsCards from "./order-duplicates/DuplicateStatsCards"
import DuplicateDecisionDialog from "./order-duplicates/DuplicateDecisionDialog"

type StatusFilter = OrderDuplicateFlagStatus | "ALL"

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  ALL: "Alle Fälle",
  OPEN: "Offen",
  RESOLVED: "Entschieden",
}

/**
 * Admin-Review der geflaggten Duplicate-Orders (#59, Backend #146/#234).
 *
 * Bewusst nur das, was der Vertrag hergibt: Liste, Zähler und das Erfassen der
 * Entscheidung. Storno und Erstattung führt der Resolve-Endpoint **nicht** aus
 * — das sagt {@link DuplicateScopeNotice} an der Oberfläche, statt einen Button
 * anzubieten, der nichts storniert.
 */
export default function AdminOrderDuplicates() {
  const [status, setStatus] = useState<StatusFilter>("OPEN")
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<OrderDuplicateFlag | null>(null)

  const list = useOrderDuplicates(status, page)
  const stats = useOrderDuplicateStats()
  const resolve = useResolveOrderDuplicate(() => setSelected(null))

  const flags = list.data?.items ?? []
  const totalPages = list.data?.totalPages ?? 1

  const reload = () => {
    void list.refetch()
    void stats.refetch()
  }

  return (
    <div>
      <PageHeader
        title="Duplikat-Prüfung"
        subtitle="Vom täglichen Scan geflaggte Bestellpaare — jede Entscheidung wird manuell getroffen"
      />

      <DuplicateScopeNotice />
      <DuplicateStatsCards stats={stats.data} />

      <AdminFilterBar>
        <select
          aria-label="Status filtern"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StatusFilter)
            setPage(0)
          }}
          className={ADMIN_SELECT_CLASS}
        >
          {(Object.keys(STATUS_FILTER_LABEL) as StatusFilter[]).map((option) => (
            <option key={option} value={option}>
              {STATUS_FILTER_LABEL[option]}
            </option>
          ))}
        </select>
        <RefreshButton onClick={reload} isLoading={list.isFetching} />
      </AdminFilterBar>

      {list.isError ? (
        <div className="rounded-xl border border-border/60 bg-ink-900/60 py-10 text-center text-sm text-danger">
          Verdachtsfälle konnten nicht geladen werden.{" "}
          <button
            type="button"
            onClick={reload}
            className="underline underline-offset-2 hover:text-muted-foreground"
          >
            Erneut versuchen
          </button>
        </div>
      ) : (
        <AdminTableContainer
          isLoading={list.isLoading}
          isEmpty={flags.length === 0}
          emptyMessage={
            status === "OPEN"
              ? "Keine offenen Verdachtsfälle."
              : "Keine Verdachtsfälle für diesen Filter."
          }
        >
          <Table>
            <TableHeader className={ADMIN_THEAD_CLASS}>
              <TableRow>
                <TableHead className={ADMIN_TH_CLASS}>Erkannt</TableHead>
                <TableHead className={ADMIN_TH_CLASS}>Bestellungen</TableHead>
                <TableHead className={ADMIN_TH_CLASS}>Käufer</TableHead>
                <TableHead className={ADMIN_TH_CLASS}>Abstand</TableHead>
                <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map((flag) => {
                const decided = isDuplicateDecided(flag)
                const confidence = duplicateConfidence(flag.secondsApart)
                return (
                  <TableRow
                    key={flag.id}
                    onClick={() => setSelected(flag)}
                    className={cn(ADMIN_TR_CLICKABLE_CLASS, decided && "opacity-70")}
                  >
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {new Date(flag.detectedAt).toLocaleString("de-DE")}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-muted-foreground">
                      {orderRefLabel(flag.duplicateOf)} → {orderRefLabel(flag.order)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {duplicateBuyerLabel(flag)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="mr-2 font-mono text-muted-foreground">
                        {formatSecondsApart(flag.secondsApart)}
                      </span>
                      <StatusBadge
                        label={DUPLICATE_CONFIDENCE_LABEL[confidence]}
                        colorClasses={DUPLICATE_CONFIDENCE_COLOR[confidence]}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {decided && flag.resolution ? (
                        <StatusBadge
                          label={DUPLICATE_RESOLUTION_LABEL[flag.resolution]}
                          colorClasses={DUPLICATE_RESOLUTION_COLOR[flag.resolution]}
                        />
                      ) : (
                        <StatusBadge
                          label="Offen"
                          colorClasses="bg-warning/40 text-warning ring-1 ring-warning/40"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <AdminTablePagination
            page={page + 1}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p - 1)}
          />
        </AdminTableContainer>
      )}

      {selected && (
        <DuplicateDecisionDialog
          flag={selected}
          isSubmitting={resolve.isPending}
          onSubmit={(dto) => resolve.mutate({ id: selected.id, ...dto })}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
