"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import type { User, UserRole, AccountStatus } from "@/src/types"
import { UserService } from "@/src/services/user.service"
import {
  ADMIN_ACCOUNT_STATUS_LABEL,
  ADMIN_ACCOUNT_STATUS_COLOR,
  ADMIN_ROLE_COLOR,
  ADMIN_SELLER_STATUS_COLOR,
  ADMIN_SELLER_STATUS_LABEL,
} from "@/src/lib/constants"
import { AdminListPage, SearchInput, ADMIN_SELECT_CLASS } from "@/src/components/shared"
import StatusBadge from "@/src/components/shared/StatusBadge"
import { TableCell } from "@/src/components/ui/table"
import { useAdminList } from "@/src/hooks/useAdminList"

const PAGE_SIZE = 10

export default function AdminUsers() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<UserRole | "">("")
  const [filterStatus, setFilterStatus] = useState<AccountStatus | "">("")

  const fetchPage = useCallback(
    async (page: number) => {
      const res = await UserService.getUsers({
        page,
        pageSize: PAGE_SIZE,
        search: searchQuery || undefined,
        role: filterRole || undefined,
        status: filterStatus || undefined,
      })
      return {
        items: res.items,
        totalPages: res.totalPages,
        totalItems: res.totalItems,
      }
    },
    [searchQuery, filterRole, filterStatus]
  )

  const { items, isLoading, page, totalPages, totalItems, setPage } = useAdminList({
    fetchPage,
    errorMessage: "Fehler beim Laden der Benutzer.",
  })

  return (
    <AdminListPage<User>
      title="Benutzerverwaltung"
      subtitle={`${totalItems} Benutzer insgesamt`}
      filters={
        <>
          <SearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v)
              setPage(0)
            }}
            placeholder="Name oder E-Mail suchen..."
          />
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value as UserRole | "")
              setPage(0)
            }}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="">Alle Rollen</option>
            <option value="BUYER">Käufer</option>
            <option value="SELLER">Verkäufer</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as AccountStatus | "")
              setPage(0)
            }}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="">Alle Status</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="SUSPENDED">Gesperrt</option>
            <option value="DELETED">Gelöscht</option>
          </select>
        </>
      }
      columns={[
        { header: "Name", key: "name" },
        { header: "E-Mail", key: "email" },
        { header: "Rolle", key: "role" },
        { header: "Status", key: "status" },
        { header: "Seller Status", key: "sellerStatus" },
      ]}
      rows={items}
      isLoading={isLoading}
      emptyMessage="Keine Benutzer gefunden."
      getRowKey={(u) => u.id}
      onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
      renderRow={(u) => (
        <>
          <TableCell className="px-4 py-3 text-sm font-medium text-slate-200">
            {u.firstName} {u.lastName}
          </TableCell>
          <TableCell className="px-4 py-3 text-sm text-slate-400">{u.email}</TableCell>
          <TableCell className="px-4 py-3">
            <StatusBadge label={u.role} colorClasses={ADMIN_ROLE_COLOR[u.role]} />
          </TableCell>
          <TableCell className="px-4 py-3">
            <StatusBadge
              label={ADMIN_ACCOUNT_STATUS_LABEL[u.status]}
              colorClasses={ADMIN_ACCOUNT_STATUS_COLOR[u.status]}
            />
          </TableCell>
          <TableCell className="px-4 py-3 text-sm text-slate-400">
            {u.sellerProfile ? (
              <StatusBadge
                label={ADMIN_SELLER_STATUS_LABEL[u.sellerProfile.status] ?? u.sellerProfile.status}
                colorClasses={
                  ADMIN_SELLER_STATUS_COLOR[u.sellerProfile.status] ?? "bg-slate-800 text-slate-500"
                }
              />
            ) : (
              "—"
            )}
          </TableCell>
        </>
      )}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  )
}
