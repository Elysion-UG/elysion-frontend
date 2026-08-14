"use client"

import { useEffect, useState } from "react"
import { useEffectEvent } from "@/src/hooks/use-effect-event"
import { Loader2, Building2, Sparkles } from "lucide-react"
import {
  useSellerProfile,
  useUpdateSellerProfile,
  useSellerValueProfile,
  useUpsertSellerValueProfile,
} from "@/src/hooks/useSellerDashboard"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import type { SellerStatus, SellerValueProfileLevel } from "@/src/types"

const STATUS_LABEL: Record<SellerStatus, string> = {
  PENDING: "Ausstehend",
  APPROVED: "Genehmigt",
  REJECTED: "Abgelehnt",
  SUSPENDED: "Gesperrt",
}

const STATUS_COLOR: Record<SellerStatus, string> = {
  PENDING: "bg-warning-tint text-warning",
  APPROVED: "bg-green-50 text-green-600",
  REJECTED: "bg-danger-tint text-danger",
  SUSPENDED: "bg-secondary text-foreground",
}

const LEVEL_OPTIONS: { value: SellerValueProfileLevel; label: string }[] = [
  { value: "STANDARD", label: "Standard" },
  { value: "LEVEL_2", label: "Level 2" },
  { value: "LEVEL_3", label: "Level 3" },
]

export default function SellerProfileTab() {
  // ── Company profile ──
  const { data: profile, isLoading: profileLoading } = useSellerProfile()
  const updateProfile = useUpdateSellerProfile()
  const [companyName, setCompanyName] = useState("")

  // Seed the editable field from the loaded profile (and any post-save refresh).
  // Wrapped in useEffectEvent so the set-state-in-effect lint rule stays happy —
  // same pattern the admin-list hooks use for load().
  const seedCompany = useEffectEvent(() => {
    if (profile) setCompanyName(profile.companyName ?? "")
  })
  useEffect(() => {
    seedCompany()
  }, [profile])

  // ── Sustainability value profile (404 → not created yet) ──
  const { data: valueProfile, isLoading: valueProfileLoading } = useSellerValueProfile()
  const upsertValueProfile = useUpsertSellerValueProfile()
  const hasValueProfile = valueProfile != null
  const [level, setLevel] = useState<SellerValueProfileLevel>("STANDARD")
  const [payload, setPayload] = useState("")

  const seedValueProfile = useEffectEvent(() => {
    if (valueProfile) {
      setLevel(valueProfile.level)
      setPayload((valueProfile.payload as string) ?? "")
    }
  })
  useEffect(() => {
    seedValueProfile()
  }, [valueProfile])

  return (
    <div className="space-y-6">
      {/* Section A — Company profile */}
      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center gap-3 border-b border-border p-6">
          <Building2 className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold text-foreground">Firmenprofil</h2>
        </div>

        {profileLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {/* Company name — editable */}
            <div>
              <label
                htmlFor="companyName"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Firmenname
              </label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="text-sm text-foreground"
              />
            </div>

            {/* VAT ID — read only */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">USt-IdNr.</label>
              <p className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                {profile?.vatId ?? "—"}
              </p>
            </div>

            {/* IBAN — read only */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">IBAN</label>
              <p className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                {profile?.iban ?? "—"}
              </p>
            </div>

            {/* Status — badge */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Status</label>
              {profile?.status ? (
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[profile.status]}`}
                >
                  {STATUS_LABEL[profile.status]}
                </span>
              ) : (
                <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                  —
                </span>
              )}
            </div>

            <div className="pt-2">
              <Button
                onClick={() => updateProfile.mutate({ companyName })}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Section B — Sustainability value profile */}
      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center gap-3 border-b border-border p-6">
          <Sparkles className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold text-foreground">Nachhaltigkeitsprofil</h2>
        </div>

        {valueProfileLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {!hasValueProfile && (
              <p className="text-sm text-muted-foreground">
                Sie haben noch kein Nachhaltigkeitsprofil. Legen Sie jetzt eines an.
              </p>
            )}

            {/* Level — dropdown */}
            <div>
              <label htmlFor="level" className="mb-1 block text-sm font-medium text-foreground">
                Stufe
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value as SellerValueProfileLevel)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-500"
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
              <label htmlFor="payload" className="mb-1 block text-sm font-medium text-foreground">
                Beschreibung / Notizen
              </label>
              <Textarea
                id="payload"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={4}
                placeholder="Optionale Angaben zu Ihrem Nachhaltigkeitskonzept ..."
                className="text-sm text-foreground"
              />
            </div>

            {/* Score — read only */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Score</label>
              <p className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                {valueProfile?.score != null ? valueProfile.score : "Noch nicht berechnet"}
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => upsertValueProfile.mutate({ level, payload: payload || undefined })}
                disabled={upsertValueProfile.isPending}
              >
                {upsertValueProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
