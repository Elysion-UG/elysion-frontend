"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import type { User, UserRole, AccountStatus } from "@/src/types"
import { UserService } from "@/src/services/user.service"
import {
  ADMIN_ACCOUNT_STATUS_LABEL,
  ADMIN_ACCOUNT_STATUS_COLOR,
  ADMIN_ROLE_COLOR,
} from "@/src/lib/constants"
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

  const getStatusBadge = (status: AccountStatus) => {
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${ADMIN_ACCOUNT_STATUS_COLOR[status]}`}
      >
        {ADMIN_ACCOUNT_STATUS_LABEL[status]}
      </span>
    )
  }

  const getRoleBadge = (role: UserRole) => {
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${ADMIN_ROLE_COLOR[role]}`}
      >
        {role}
      </span>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 font-mono text-2xl font-bold tracking-wide text-slate-100">
          Benutzerverwaltung
        </h1>
        <p className="text-slate-500">{total} Benutzer insgesamt</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-900/60 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Name oder E-Mail suchen..."
            className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-cyber-600 focus:ring-2 focus:ring-cyber-600/20"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value as UserRole | "")
            setPage(1)
          }}
          className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-cyber-600/20"
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
          className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:ring-2 focus:ring-cyber-600/20"
        >
          <option value="">Alle Status</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="SUSPENDED">Gesperrt</option>
          <option value="DELETED">Gelöscht</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/60">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Keine Benutzer gefunden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800/60 bg-slate-800/30">
                <tr>
                  <th className="px-6 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                    E-Mail
                  </th>
                  <th className="px-6 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                    Rolle
                  </th>
                  <th className="px-6 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                    Seller Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => router.push(`/admin/users/${u.id}`)}
                    className="cursor-pointer hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-200">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{u.email}</td>
                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-6 py-4">{getStatusBadge(u.status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {u.sellerProfile ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.sellerProfile.status === "APPROVED"
                              ? "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40"
                              : u.sellerProfile.status === "PENDING"
                                ? "bg-amber-900/40 text-amber-400 ring-1 ring-amber-700/40"
                                : "bg-red-900/40 text-red-400 ring-1 ring-red-700/40"
                          }`}
                        >
                          {u.sellerProfile.status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/60 px-6 py-4">
            <p className="text-sm text-slate-500">
              Seite {page} von {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-700/60 bg-slate-800/60 p-2 text-slate-400 hover:bg-slate-700/60 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-700/60 bg-slate-800/60 p-2 text-slate-400 hover:bg-slate-700/60 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
