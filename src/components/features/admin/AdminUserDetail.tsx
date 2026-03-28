"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft, Loader2, User, Mail, Phone, Calendar, Building2,
  ShieldCheck, ShieldAlert, CheckCircle, XCircle, AlertTriangle,
} from "lucide-react"
import type { User as UserType } from "@/src/types"
import { UserService } from "@/src/services/user.service"
import { toast } from "sonner"

export default function AdminUserDetail() {
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams(window.location.search)
      const id = params.get("id") ?? window.location.pathname.split("/").pop()
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">Benutzer nicht gefunden.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => { window.location.href = "/admin/users" }}
        className="flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
      </button>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{user.firstName} {user.lastName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  user.role === "ADMIN" ? "bg-indigo-100 text-indigo-700"
                  : user.role === "SELLER" ? "bg-teal-100 text-teal-700"
                  : "bg-slate-100 text-slate-700"
                }`}>{user.role}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  user.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700"
                  : user.status === "SUSPENDED" ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
                }`}>{user.status === "ACTIVE" ? "Aktiv" : user.status === "SUSPENDED" ? "Gesperrt" : "Ausstehend"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700">{user.phone ?? "Nicht angegeben"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700">Registriert: {new Date(user.createdAt).toLocaleDateString("de-DE")}</span>
            </div>
          </div>

          {/* Seller profile info */}
          {user.sellerProfile && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Verkäuferprofil
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Firma:</span>{" "}
                  <span className="text-slate-700 font-medium">{user.sellerProfile.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-500">USt-IdNr.:</span>{" "}
                  <span className="text-slate-700 font-medium">{user.sellerProfile.vatId}</span>
                </div>
                <div>
                  <span className="text-slate-500">IBAN:</span>{" "}
                  <span className="text-slate-700 font-medium">{user.sellerProfile.iban}</span>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{" "}
                  <span className={`font-medium ${
                    user.sellerProfile.status === "APPROVED" ? "text-emerald-700"
                    : user.sellerProfile.status === "PENDING" ? "text-amber-700"
                    : "text-red-700"
                  }`}>{user.sellerProfile.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-200 flex flex-wrap gap-3">
          {/* Suspend / Activate */}
          <button
            onClick={handleSuspend}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
              user.status === "SUSPENDED"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : user.status === "SUSPENDED" ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            {user.status === "SUSPENDED" ? "Aktivieren" : "Sperren"}
          </button>

          {/* Seller approve / reject */}
          {user.sellerProfile && user.sellerProfile.status === "PENDING" && (
            <>
              <button
                onClick={() => handleSellerAction("APPROVED")}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Verkäufer genehmigen
              </button>
              <button
                onClick={() => handleSellerAction("REJECTED")}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Verkäufer ablehnen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
