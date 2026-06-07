"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminService } from "@/src/services/admin.service"
import type { AdminOrderListItem, OrderStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import {
  ADMIN_ORDER_STATUS_LABEL as statusLabel,
  ADMIN_ORDER_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import {
  PageHeader,
  AdminFilterBar,
  SearchInput,
  RefreshButton,
  AdminTableContainer,
  AdminTablePagination,
  ADMIN_TH_CLASS,
  ADMIN_THEAD_CLASS,
  ADMIN_TR_CLICKABLE_CLASS,
  ADMIN_SELECT_CLASS,
} from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"
import { toast } from "sonner"

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<AdminOrderListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("")
  const [searchQuery, setSearchQuery] = useState("")

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await AdminService.listOrders({
        page,
        size: 20,
        status: statusFilter || undefined,
      })
      const items = res.items ?? []
      setOrders(
        searchQuery
          ? items.filter(
              (o) =>
                o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.guestEmail?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : items
      )
      setTotalPages(res.totalPages ?? 1)
    } catch {
      toast.error("Fehler beim Laden der Bestellungen.")
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <PageHeader
        title="Bestellungs-Verwaltung"
        subtitle="Übersicht aller Plattform-Bestellungen"
      />

      <AdminFilterBar>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Bestellnummer oder E-Mail..."
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as OrderStatus | "")
            setPage(0)
          }}
          className={ADMIN_SELECT_CLASS}
        >
          <option value="">Alle Status</option>
          {(Object.keys(statusLabel) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </select>
        <RefreshButton onClick={load} />
      </AdminFilterBar>

      <AdminTableContainer
        isLoading={isLoading}
        isEmpty={orders.length === 0}
        emptyMessage="Keine Bestellungen gefunden."
      >
        <Table>
          <TableHeader className={ADMIN_THEAD_CLASS}>
            <TableRow>
              <TableHead className={ADMIN_TH_CLASS}>Bestellnr.</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Käufer</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Zahlung</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Gesamt</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Datum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className={ADMIN_TR_CLICKABLE_CLASS}
              >
                <TableCell className="px-4 py-3 font-mono text-slate-300">
                  {order.orderNumber}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-500">
                  {order.guestEmail ?? order.userId?.slice(0, 8) ?? "–"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StatusBadge
                    label={statusLabel[order.status]}
                    colorClasses={statusColor[order.status]}
                  />
                </TableCell>
                <TableCell className="px-4 py-3 text-xs text-slate-500">
                  {order.paymentStatus}
                </TableCell>
                <TableCell className="px-4 py-3 font-medium text-slate-200">
                  {formatEuro(order.total)}
                </TableCell>
                <TableCell className="px-4 py-3 text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString("de-DE")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <AdminTablePagination
          page={page + 1}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p - 1)}
        />
      </AdminTableContainer>
    </div>
  )
}
