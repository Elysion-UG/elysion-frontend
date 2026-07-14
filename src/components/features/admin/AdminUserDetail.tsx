"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
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
import {
  ADMIN_ACCOUNT_STATUS_LABEL,
  ADMIN_ACCOUNT_STATUS_COLOR,
  ADMIN_ROLE_COLOR,
  ADMIN_SELLER_STATUS_LABEL,
  ADMIN_SELLER_DETAIL_STATUS_COLOR,
} from "@/src/lib/constants"
import { BackButton, LoadingFullPage, StatusBadge } from "@/src/components/shared"
import { toast } from "sonner"

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>()
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
  }, [id])

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
    return <LoadingFullPage className="min-h-[60vh]" />
  }

  if (!user) {
    return (
      <div className="py-12 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-foreground" />
        <p className="text-muted-foreground">Benutzer nicht gefunden.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <BackButton
        label="Zurück zur Übersicht"
        className="mb-6 transition-colors hover:text-green-500"
      />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-ink-900/60">
        {/* Header */}
        <div className="border-b border-border/60 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-700/60 ring-1 ring-green-500/40">
              <User className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h1 className="font-mono text-2xl font-normal tracking-wide text-muted-foreground">
                {user.firstName} {user.lastName}
              </h1>
              <div className="mt-1 flex items-center gap-3">
                <StatusBadge label={user.role} colorClasses={ADMIN_ROLE_COLOR[user.role]} />
                <StatusBadge
                  label={ADMIN_ACCOUNT_STATUS_LABEL[user.status]}
                  colorClasses={ADMIN_ACCOUNT_STATUS_COLOR[user.status]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-foreground" />
              <span className="text-muted-foreground">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-foreground" />
              <span className="text-muted-foreground">{user.phone ?? "Nicht angegeben"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-foreground" />
              <span className="text-muted-foreground">
                Registriert: {new Date(user.createdAt).toLocaleDateString("de-DE")}
              </span>
            </div>
          </div>

          {/* Seller profile info */}
          {user.sellerProfile && (
            <div className="mt-6 space-y-3 rounded-lg border border-border/60 bg-ink-900/30 p-4">
              <h3 className="flex items-center gap-2 font-mono font-semibold text-muted-foreground">
                <Building2 className="h-4 w-4 text-green-500" /> Verkäuferprofil
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Firma:</span>{" "}
                  <span className="font-medium text-muted-foreground">
                    {user.sellerProfile.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">USt-IdNr.:</span>{" "}
                  <span className="font-medium text-muted-foreground">
                    {user.sellerProfile.vatId}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">IBAN:</span>{" "}
                  <span className="font-medium text-muted-foreground">
                    {user.sellerProfile.iban}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <StatusBadge
                    label={ADMIN_SELLER_STATUS_LABEL[user.sellerProfile.status]}
                    colorClasses={ADMIN_SELLER_DETAIL_STATUS_COLOR[user.sellerProfile.status]}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 border-t border-border/60 p-6">
          {/* Suspend / Activate */}
          <button
            onClick={handleSuspend}
            disabled={isUpdating}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              user.status === "SUSPENDED"
                ? "bg-green-700 text-ink-900 hover:bg-green-500"
                : "bg-destructive text-white hover:bg-destructive"
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
                className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-green-500 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" /> Verkäufer genehmigen
              </button>
              <button
                onClick={() => handleSellerAction("REJECTED")}
                disabled={isUpdating}
                className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive disabled:opacity-50"
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
