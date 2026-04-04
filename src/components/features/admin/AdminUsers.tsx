"use client"

import { useState, useEffect, useCallback } from "react"
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
import {
  PageHeader,
  AdminFilterBar,
  SearchInput,
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

export default function AdminUsers() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<UserRole | "">("")
  const [filterStatus, setFilterStatus] = useState<AccountStatus | "">("")
  const [isLoading, setIsLoading] = useState(true)
  const pageSize = 10

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await UserService.getUsers({
        page,
        pageSize,
        search: searchQuery || undefined,
        role: filterRole || undefined,
        status: filterStatus || undefined,
      })
      setUsers(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch {
      toast.error("Fehler beim Laden der Benutzer.")
    } finally {
      setIsLoading(false)
    }
  }, [page, searchQuery, filterRole, filterStatus])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return (
    <div>
      <PageHeader title="Benutzerverwaltung" subtitle={`${total} Benutzer insgesamt`} />

      <AdminFilterBar>
        <SearchInput
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v)
            setPage(1)
          }}
          placeholder="Name oder E-Mail suchen..."
        />
        <select
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value as UserRole | "")
            setPage(1)
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
            setPage(1)
          }}
          className={ADMIN_SELECT_CLASS}
        >
          <option value="">Alle Status</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="SUSPENDED">Gesperrt</option>
          <option value="DELETED">Gelöscht</option>
        </select>
      </AdminFilterBar>

      <AdminTableContainer
        isLoading={isLoading}
        isEmpty={users.length === 0}
        emptyMessage="Keine Benutzer gefunden."
      >
        <Table>
          <TableHeader className={ADMIN_THEAD_CLASS}>
            <TableRow>
              <TableHead className={ADMIN_TH_CLASS}>Name</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>E-Mail</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Rolle</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Status</TableHead>
              <TableHead className={ADMIN_TH_CLASS}>Seller Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow
                key={u.id}
                onClick={() => router.push(`/admin/users/${u.id}`)}
                className={ADMIN_TR_CLICKABLE_CLASS}
              >
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
                      label={
                        ADMIN_SELLER_STATUS_LABEL[u.sellerProfile.status] ?? u.sellerProfile.status
                      }
                      colorClasses={
                        ADMIN_SELLER_STATUS_COLOR[u.sellerProfile.status] ??
                        "bg-slate-800 text-slate-500"
                      }
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <AdminTablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </AdminTableContainer>
    </div>
  )
}
