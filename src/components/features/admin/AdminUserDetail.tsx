"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import type { User as UserType } from "@/src/types"
import { UserService } from "@/src/services/user.service"
import { toast } from "sonner"

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        const u = await UserService.getUserById(id)
        setUser(u)
      } catch {
        toast.error("Benutzer nicht gefunden.")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleSuspend = async () => {
    if (!user) return
    setIsUpdating(true)
    try {
      const newStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"
      await UserService.updateUserStatus(user.id, newStatus)
      setUser({ ...user, status: newStatus })
      toast.success(newStatus === "SUSPENDED" ? "Benutzer gesperrt." : "Benutzer aktiviert.")
    } catch {
      toast.error("Fehler beim Aktualisieren.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSellerAction = async (action: "APPROVED" | "REJECTED") => {
    if (!user?.sellerProfile) return
    setIsUpdating(true)
    try {
      // Use the seller profile's own ID (not the user ID) for admin seller endpoints
      await UserService.updateSellerStatus(user.sellerProfile.id, action)
      setUser({
        ...user,
        sellerProfile: { ...user.sellerProfile, status: action },
      })
      toast.success(action === "APPROVED" ? "Verkäufer genehmigt." : "Verkäufer abgelehnt.")
    } catch {
      toast.error("Fehler beim Aktualisieren.")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-12 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-slate-600" />
        <p className="text-slate-500">Benutzer nicht gefunden.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => {
          router.back()
        }}
        className="mb-6 flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-cyber-400"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
      </button>

      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/60">
        {/* Header */}
        <div className="border-b border-slate-800/60 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyber-900/60 ring-1 ring-cyber-700/40">
              <User className="h-8 w-8 text-cyber-500" />
            </div>
            <div>
              <h1 className="font-mono text-2xl font-bold tracking-wide text-slate-100">
                {user.firstName} {user.lastName}
              </h1>
              <div className="mt-1 flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-indigo-900/50 text-indigo-400 ring-1 ring-indigo-700/40"
                      : user.role === "SELLER"
                        ? "bg-cyber-900/50 text-cyber-400 ring-1 ring-cyber-700/40"
                        : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.status === "ACTIVE"
                      ? "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40"
                      : user.status === "SUSPENDED"
                        ? "bg-red-900/40 text-red-400 ring-1 ring-red-700/40"
                        : "bg-amber-900/40 text-amber-400 ring-1 ring-amber-700/40"
                  }`}
                >
                  {user.status === "ACTIVE"
                    ? "Aktiv"
                    : user.status === "SUSPENDED"
                      ? "Gesperrt"
                      : "Ausstehend"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-slate-600" />
              <span className="text-slate-300">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-slate-600" />
              <span className="text-slate-300">{user.phone ?? "Nicht angegeben"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-600" />
              <span className="text-slate-300">
                Registriert: {new Date(user.createdAt).toLocaleDateString("de-DE")}
              </span>
            </div>
          </div>

          {/* Seller profile info */}
          {user.sellerProfile && (
            <div className="mt-6 space-y-3 rounded-lg border border-slate-800/60 bg-slate-800/30 p-4">
              <h3 className="flex items-center gap-2 font-mono font-semibold text-slate-200">
                <Building2 className="h-4 w-4 text-cyber-500" /> Verkäuferprofil
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div>
                  <span className="text-slate-500">Firma:</span>{" "}
                  <span className="font-medium text-slate-300">
                    {user.sellerProfile.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">USt-IdNr.:</span>{" "}
                  <span className="font-medium text-slate-300">{user.sellerProfile.vatId}</span>
                </div>
                <div>
                  <span className="text-slate-500">IBAN:</span>{" "}
                  <span className="font-medium text-slate-300">{user.sellerProfile.iban}</span>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{" "}
                  <span
                    className={`font-medium ${
                      user.sellerProfile.status === "APPROVED"
                        ? "text-emerald-400"
                        : user.sellerProfile.status === "PENDING"
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {user.sellerProfile.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 border-t border-slate-800/60 p-6">
          {/* Suspend / Activate */}
          <button
            onClick={handleSuspend}
            disabled={isUpdating}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              user.status === "SUSPENDED"
                ? "bg-emerald-700 text-white hover:bg-emerald-600"
                : "bg-red-700 text-white hover:bg-red-600"
            }`}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : user.status === "SUSPENDED" ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            {user.status === "SUSPENDED" ? "Aktivieren" : "Sperren"}
          </button>

          {/* Seller approve / reject */}
          {user.sellerProfile && user.sellerProfile.status === "PENDING" && (
            <>
              <button
                onClick={() => handleSellerAction("APPROVED")}
                disabled={isUpdating}
                className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" /> Verkäufer genehmigen
              </button>
              <button
                onClick={() => handleSellerAction("REJECTED")}
                disabled={isUpdating}
                className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Verkäufer ablehnen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
