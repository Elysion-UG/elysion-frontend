"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminService } from "@/src/services/admin.service"
import type { AdminOrderListItem, OrderStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import {
  ADMIN_ORDER_STATUS_LABEL as statusLabel,
  ADMIN_ORDER_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import {
  AdminListPage,
  SearchInput,
  RefreshButton,
  ADMIN_SELECT_CLASS,
} from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
import { TableCell } from "@/src/components/ui/table"
import { useAdminList } from "@/src/hooks/useAdminList"

export default function AdminOrders() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchPage = useCallback(
    async (page: number) => {
      const res = await AdminService.listOrders({
        page,
        size: 20,
        status: statusFilter || undefined,
      })
      const items = res.items ?? []
      return {
        items: searchQuery
          ? items.filter(
              (o) =>
                o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.guestEmail?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : items,
        totalPages: res.totalPages ?? 1,
      }
    },
    [statusFilter, searchQuery]
  )

  const { items, isLoading, page, totalPages, setPage, reload } = useAdminList({
    fetchPage,
    errorMessage: "Fehler beim Laden der Bestellungen.",
  })

  return (
    <AdminListPage<AdminOrderListItem>
      title="Bestellungs-Verwaltung"
      subtitle="Übersicht aller Plattform-Bestellungen"
      filters={
        <>
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
          <RefreshButton onClick={reload} />
        </>
      }
      columns={[
        { header: "Bestellnr.", key: "orderNumber" },
        { header: "Käufer", key: "buyer" },
        { header: "Status", key: "status" },
        { header: "Zahlung", key: "payment" },
        { header: "Gesamt", key: "total" },
        { header: "Datum", key: "date" },
      ]}
      rows={items}
      isLoading={isLoading}
      emptyMessage="Keine Bestellungen gefunden."
      getRowKey={(order) => order.id}
      onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
      renderRow={(order) => (
        <>
          <TableCell className="px-4 py-3 font-mono text-slate-300">{order.orderNumber}</TableCell>
          <TableCell className="px-4 py-3 text-slate-500">
            {order.guestEmail ?? order.userId?.slice(0, 8) ?? "–"}
          </TableCell>
          <TableCell className="px-4 py-3">
            <StatusBadge
              label={statusLabel[order.status]}
              colorClasses={statusColor[order.status]}
            />
          </TableCell>
          <TableCell className="px-4 py-3 text-xs text-slate-500">{order.paymentStatus}</TableCell>
          <TableCell className="px-4 py-3 font-medium text-slate-200">
            {formatEuro(order.total)}
          </TableCell>
          <TableCell className="px-4 py-3 text-slate-500">
            {new Date(order.createdAt).toLocaleDateString("de-DE")}
          </TableCell>
        </>
      )}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  )
}
