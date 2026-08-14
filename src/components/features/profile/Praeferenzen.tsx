"use client"

import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import {
  ExtendedWeightsSection,
  PraeferenzenSkeleton,
  ProfileTypeSwitcher,
  SimpleWeightsSection,
  usePraeferenzenForm,
} from "./praeferenzen-parts"

export default function Praeferenzen() {
  const {
    isLoading,
    hasError,
    isSaving,
    profileType,
    simpleWeights,
    extendedWeights,
    setProfileType,
    setSimpleWeight,
    setExtendedWeight,
    save,
  } = usePraeferenzenForm()

  if (isLoading) {
    return <PraeferenzenSkeleton />
  }

  if (hasError) {
    return (
      <div className="mx-auto max-w-4xl py-16 text-center text-danger">
        Präferenzen konnten nicht geladen werden.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50">
          <Sparkles className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-normal text-foreground">Präferenzen</h1>
          <p className="text-sm text-muted-foreground">
            Nachhaltigkeitswerte festlegen — beeinflusst Produktempfehlungen
          </p>
        </div>
      </div>

      <ProfileTypeSwitcher value={profileType} onChange={setProfileType} />

      {profileType === "none" && (
        <div className="rounded-xl border border-border bg-secondary p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Kein Werteprofil aktiv</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Produkte werden ohne Nachhaltigkeitsgewichtung angezeigt.
          </p>
        </div>
      )}

      {profileType === "simple" && (
        <SimpleWeightsSection weights={simpleWeights} onChange={setSimpleWeight} />
      )}

      {profileType === "extended" && (
        <ExtendedWeightsSection weights={extendedWeights} onChange={setExtendedWeight} />
      )}

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={save} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Wird gespeichert...
            </>
          ) : (
            "Präferenzen speichern"
          )}
        </Button>
      </div>
    </div>
  )
}
