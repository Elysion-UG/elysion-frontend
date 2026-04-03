"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Building2, Leaf } from "lucide-react"
import { SellerProfileService } from "@/src/services/seller-profile.service"
import { SellerValueProfileService } from "@/src/services/seller-value-profile.service"
import type { SellerProfile, SellerStatus, SellerValueProfileLevel } from "@/src/types"
import { toast } from "sonner"
import { ApiError } from "@/src/lib/api-client"

const STATUS_LABEL: Record<SellerStatus, string> = {
  PENDING: "Ausstehend",
  APPROVED: "Genehmigt",
  REJECTED: "Abgelehnt",
  SUSPENDED: "Gesperrt",
}

const STATUS_COLOR: Record<SellerStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-slate-100 text-slate-600",
}

const LEVEL_OPTIONS: { value: SellerValueProfileLevel; label: string }[] = [
  { value: "STANDARD", label: "Standard" },
  { value: "LEVEL_2", label: "Level 2" },
  { value: "LEVEL_3", label: "Level 3" },
]

interface ValueProfileState {
  level: SellerValueProfileLevel
  payload: string
  score: number | null
}

export default function SellerProfileTab() {
  // ── Company profile state ──
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [companyName, setCompanyName] = useState("")

  // ── Value profile state ──
  const [valueProfile, setValueProfile] = useState<ValueProfileState>({
    level: "STANDARD",
    payload: "",
    score: null,
  })
  const [valueProfileLoading, setValueProfileLoading] = useState(true)
  const [valueProfileSaving, setValueProfileSaving] = useState(false)
  const [hasValueProfile, setHasValueProfile] = useState(false)

  // ── Fetch company profile ──
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true)
    try {
      const data = await SellerProfileService.get()
      setProfile(data)
      setCompanyName(data.companyName ?? "")
    } catch {
      toast.error("Firmenprofil konnte nicht geladen werden.")
    } finally {
      setProfileLoading(false)
    }
  }, [])

  // ── Fetch value profile ──
  const fetchValueProfile = useCallback(async () => {
    setValueProfileLoading(true)
    try {
      const data = await SellerValueProfileService.get()
      setValueProfile({
        level: data.level,
        payload: data.payload ?? "",
        score: data.score ?? null,
      })
      setHasValueProfile(true)
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setHasValueProfile(false)
      } else {
        toast.error("Nachhaltigkeitsprofil konnte nicht geladen werden.")
      }
    } finally {
      setValueProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
    fetchValueProfile()
  }, [fetchProfile, fetchValueProfile])

  // ── Save company profile ──
  const handleProfileSave = async () => {
    setProfileSaving(true)
    try {
      const updated = await SellerProfileService.update({ companyName })
      setProfile(updated)
      toast.success("Firmenprofil gespeichert.")
    } catch {
      toast.error("Firmenprofil konnte nicht gespeichert werden.")
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Save value profile ──
  const handleValueProfileSave = async () => {
    setValueProfileSaving(true)
    try {
      const updated = await SellerValueProfileService.upsert({
        level: valueProfile.level,
        payload: valueProfile.payload || undefined,
      })
      setValueProfile({
        level: updated.level,
        payload: updated.payload ?? "",
        score: updated.score ?? null,
      })
      setHasValueProfile(true)
      toast.success("Nachhaltigkeitsprofil gespeichert.")
    } catch {
      toast.error("Nachhaltigkeitsprofil konnte nicht gespeichert werden.")
    } finally {
      setValueProfileSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Section A — Company profile */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 p-6">
          <Building2 className="h-5 w-5 text-teal-600" />
          <h2 className="text-xl font-semibold text-slate-800">Firmenprofil</h2>
        </div>

        {profileLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {/* Company name — editable */}
            <div>
              <label
                htmlFor="companyName"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Firmenname
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* VAT ID — read only */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">USt-IdNr.</label>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {profile?.vatId ?? "—"}
              </p>
            </div>

            {/* IBAN — read only */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">IBAN</label>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {profile?.iban ?? "—"}
              </p>
            </div>

            {/* Status — badge */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              {profile?.status ? (
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[profile.status]}`}
                >
                  {STATUS_LABEL[profile.status]}
                </span>
              ) : (
                <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  —
                </span>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleProfileSave}
                disabled={profileSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
              >
                {profileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Speichern
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section B — Sustainability value profile */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 p-6">
          <Leaf className="h-5 w-5 text-teal-600" />
          <h2 className="text-xl font-semibold text-slate-800">Nachhaltigkeitsprofil</h2>
        </div>

        {valueProfileLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {!hasValueProfile && (
              <p className="text-sm text-slate-500">
                Sie haben noch kein Nachhaltigkeitsprofil. Legen Sie jetzt eines an.
              </p>
            )}

            {/* Level — dropdown */}
            <div>
              <label htmlFor="level" className="mb-1 block text-sm font-medium text-slate-700">
                Stufe
              </label>
              <select
                id="level"
                value={valueProfile.level}
                onChange={(e) =>
                  setValueProfile({
                    ...valueProfile,
                    level: e.target.value as SellerValueProfileLevel,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payload — textarea */}
            <div>
              <label htmlFor="payload" className="mb-1 block text-sm font-medium text-slate-700">
                Beschreibung / Notizen
              </label>
              <textarea
                id="payload"
                value={valueProfile.payload}
                onChange={(e) => setValueProfile({ ...valueProfile, payload: e.target.value })}
                rows={4}
                placeholder="Optionale Angaben zu Ihrem Nachhaltigkeitskonzept ..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Score — read only */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Score</label>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {valueProfile.score != null ? valueProfile.score : "Noch nicht berechnet"}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleValueProfileSave}
                disabled={valueProfileSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
              >
                {valueProfileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Speichern
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
