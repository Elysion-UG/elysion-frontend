"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, ChevronLeft, ChevronRight, Loader2, Eye, Shield, ShieldAlert } from "lucide-react"
import type { User, UserRole, AccountStatus } from "@/src/types"
import { UserService } from "@/src/services/user.service"
import { toast } from "sonner"

export default function AdminUsers() {
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

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleViewUser = (userId: string) => {
    window.location.href = `/admin/users/${userId}`
  }

  const getStatusBadge = (status: AccountStatus) => {
    const styles: Record<AccountStatus, string> = {
      PENDING: "bg-yellow-100 text-yellow-700",
      ACTIVE: "bg-emerald-100 text-emerald-700",
      SUSPENDED: "bg-red-100 text-red-700",
      DELETED: "bg-slate-100 text-slate-500",
    }
    const labels: Record<AccountStatus, string> = {
      PENDING: "Ausstehend",
      ACTIVE: "Aktiv",
      SUSPENDED: "Gesperrt",
      DELETED: "Gelöscht",
    }
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>{labels[status]}</span>
  }

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      BUYER: "bg-slate-100 text-slate-700",
      SELLER: "bg-teal-100 text-teal-700",
      ADMIN: "bg-indigo-100 text-indigo-700",
    }
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[role]}`}>{role}</span>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Benutzerverwaltung</h1>
        <p className="text-slate-600">{total} Benutzer insgesamt</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            placeholder="Name oder E-Mail suchen..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value as UserRole | ""); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 text-slate-700"
        >
          <option value="">Alle Rollen</option>
          <option value="BUYER">Käufer</option>
          <option value="SELLER">Verkäufer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as AccountStatus | ""); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 text-slate-700"
        >
          <option value="">Alle Status</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="SUSPENDED">Gesperrt</option>
          <option value="DELETED">Gelöscht</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Keine Benutzer gefunden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">E-Mail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rolle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Seller Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{u.firstName} {u.lastName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-6 py-4">{getStatusBadge(u.status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {u.sellerProfile ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.sellerProfile.status === "APPROVED" ? "bg-emerald-100 text-emerald-700"
                          : u.sellerProfile.status === "PENDING" ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                        }`}>{u.sellerProfile.status}</span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewUser(u.id)}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">Seite {page} von {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
