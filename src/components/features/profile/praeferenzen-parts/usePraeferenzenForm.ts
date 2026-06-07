"use client"

import { useCallback, useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { ValuesProfileType } from "@/src/types"
import { BuyerValueProfileService } from "@/src/services/buyer-value-profile.service"
import { useBuyerValueProfile } from "@/src/hooks/useBuyerValueProfile"
import { defaultExtendedWeights, defaultSimpleWeights } from "./preferences-constants"

export interface UsePraeferenzenForm {
  isLoading: boolean
  hasError: boolean
  isSaving: boolean
  profileType: ValuesProfileType
  simpleWeights: Record<string, number>
  extendedWeights: Record<string, Record<string, number>>
  setProfileType: (v: ValuesProfileType) => void
  setSimpleWeight: (categoryId: string, weight: number) => void
  setExtendedWeight: (categoryId: string, subId: string, weight: number) => void
  save: () => Promise<void>
}

export function usePraeferenzenForm(): UsePraeferenzenForm {
  const queryClient = useQueryClient()
  const { data: profile, isLoading, error } = useBuyerValueProfile()

  const [profileType, setProfileType] = useState<ValuesProfileType>("none")
  const [simpleWeights, setSimpleWeights] = useState<Record<string, number>>(defaultSimpleWeights)
  const [extendedWeights, setExtendedWeights] =
    useState<Record<string, Record<string, number>>>(defaultExtendedWeights)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setProfileType(profile.activeProfileType)
    if (profile.simpleProfile) {
      setSimpleWeights((prev) => ({ ...prev, ...profile.simpleProfile }))
    }
    if (profile.extendedProfile) {
      setExtendedWeights((prev) => {
        const next = { ...prev }
        for (const catId of Object.keys(profile.extendedProfile!)) {
          next[catId] = { ...(prev[catId] ?? {}), ...profile.extendedProfile![catId] }
        }
        return next
      })
    }
  }, [profile])

  const setSimpleWeight = useCallback((categoryId: string, weight: number) => {
    setSimpleWeights((prev) => ({ ...prev, [categoryId]: weight }))
  }, [])

  const setExtendedWeight = useCallback((categoryId: string, subId: string, weight: number) => {
    setExtendedWeights((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [subId]: weight },
    }))
  }, [])

  const save = useCallback(async () => {
    setIsSaving(true)
    try {
      await BuyerValueProfileService.upsert({
        activeProfileType: profileType,
        simpleProfile: profileType === "simple" ? simpleWeights : null,
        extendedProfile: profileType === "extended" ? extendedWeights : null,
      })
      await queryClient.invalidateQueries({ queryKey: ["buyerValueProfile"] })
      toast.success("Präferenzen gespeichert.")
    } catch {
      toast.error("Fehler beim Speichern.")
    } finally {
      setIsSaving(false)
    }
  }, [profileType, simpleWeights, extendedWeights, queryClient])

  return {
    isLoading,
    hasError: Boolean(error),
    isSaving,
    profileType,
    simpleWeights,
    extendedWeights,
    setProfileType,
    setSimpleWeight,
    setExtendedWeight,
    save,
  }
}
