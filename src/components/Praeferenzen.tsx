"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Star, Leaf, Recycle, Heart, Shield, Globe, Cpu, Loader2 } from "lucide-react"
import type { ValuesProfileType } from "@/src/types"
import { useAuth } from "@/src/context/AuthContext"
import { BuyerValueProfileService } from "@/src/services/buyer-value-profile.service"
import { ApiError } from "@/src/lib/api-client"
import { toast } from "sonner"

// Exactly 7 categories as per Module 01 spec
const CATEGORIES = [
  { id: "produktqualitaet", title: "Produktqualität", icon: Star, subs: [
    { id: "qualitaetsparameter", label: "Qualitätsparameter" },
    { id: "schadstofffreiheit", label: "Schadstofffreiheit" },
  ]},
  { id: "oekologisch", title: "Ökologische Nachhaltigkeit", icon: Leaf, subs: [
    { id: "umwelt_schutz", label: "Schutz von Umwelt, Natur und Ressourcen" },
    { id: "klimaschutz", label: "Klimaschutz, Artenvielfalt, Ressourcenschonung" },
  ]},
  { id: "oekonomisch", title: "Ökonomische Nachhaltigkeit", icon: Recycle, subs: [
    { id: "langfristig_tragfaehig", label: "Wirtschaftliches Handeln langfristig tragfähig gestalten" },
    { id: "innovation", label: "Stabilität, Innovation, verantwortungsvolles Wachstum" },
  ]},
  { id: "sozial", title: "Soziale Nachhaltigkeit", icon: Heart, subs: [
    { id: "gerechtigkeit", label: "Gerechtigkeit, Chancengleichheit, soziale Sicherheit" },
    { id: "menschenrechte", label: "Menschenrechte, Bildung, Gesundheit, faire Arbeit" },
  ]},
  { id: "kulturell", title: "Kulturelle Nachhaltigkeit", icon: Globe, subs: [
    { id: "kulturelle_vielfalt", label: "Erhalt kultureller Vielfalt und Traditionen" },
    { id: "lokale_kulturen", label: "Unterstützung lokaler Kulturen" },
  ]},
  { id: "politisch", title: "Politische Nachhaltigkeit", icon: Shield, subs: [
    { id: "demokratie", label: "Demokratische Strukturen, Rechtsstaatlichkeit" },
    { id: "good_governance", label: "Gute Regierungsführung, transparente Entscheidungen" },
  ]},
  { id: "technologisch", title: "Technologische Nachhaltigkeit", icon: Cpu, subs: [
    { id: "umweltfreundliche_tech", label: "Umweltfreundliche und effiziente Technologien" },
    { id: "technikfolgen", label: "Technikfolgenabschätzung, Innovation im Einklang" },
    { id: "digitalisierung", label: "Nachhaltige Digitalisierung" },
  ]},
]

const defaultSimpleWeights = (): Record<string, number> => {
  const init: Record<string, number> = {}
  CATEGORIES.forEach((c) => { init[c.id] = 50 })
  return init
}

const defaultExtendedWeights = (): Record<string, Record<string, number>> => {
  const init: Record<string, Record<string, number>> = {}
  CATEGORIES.forEach((c) => {
    init[c.id] = {}
    c.subs.forEach((s) => { init[c.id][s.id] = 50 })
  })
  return init
}

export default function Praeferenzen() {
  const { user } = useAuth()
  const [profileType, setProfileType] = useState<ValuesProfileType>("none")
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [simpleWeights, setSimpleWeights] = useState<Record<string, number>>(defaultSimpleWeights)
  const [extendedWeights, setExtendedWeights] = useState<Record<string, Record<string, number>>>(defaultExtendedWeights)

  useEffect(() => {
    async function load() {
      try {
        const profile = await BuyerValueProfileService.get()
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
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          // No profile yet — defaults remain
        } else {
          toast.error("Profil konnte nicht geladen werden.")
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await BuyerValueProfileService.upsert({
        activeProfileType: profileType,
        simpleProfile: profileType === "simple" ? simpleWeights : null,
        extendedProfile: profileType === "extended" ? extendedWeights : null,
      })
      toast.success("Präferenzen gespeichert.")
    } catch (e) {
      toast.error("Fehler beim Speichern.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Präferenzen</h1>
        <p className="text-slate-600">
          Passen Sie Ihre Nachhaltigkeitspräferenzen an. Diese Werte beeinflussen die Produktempfehlungen.
        </p>
      </div>

      {/* Profile type switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-3">Profiltyp</label>
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: "none" as const, label: "Kein Profil", desc: "Keine Nachhaltigkeitsfilterung" },
            { value: "simple" as const, label: "Einfach", desc: "Ein Gewicht pro Kategorie" },
            { value: "extended" as const, label: "Erweitert", desc: "Gewichte pro Unterkategorie" },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setProfileType(opt.value)}
              className={`p-3 border-2 rounded-lg text-left transition-colors ${
                profileType === opt.value ? "border-teal-600 bg-teal-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className={`block text-sm font-semibold ${profileType === opt.value ? "text-teal-700" : "text-slate-700"}`}>
                {opt.label}
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* None selected */}
      {profileType === "none" && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-600">Sie haben aktuell kein Werteprofil aktiv. Produkte werden ohne Nachhaltigkeitsgewichtung angezeigt.</p>
        </div>
      )}

      {/* Simple mode */}
      {profileType === "simple" && (
        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-lg font-semibold text-slate-800">{category.title}</span>
                  <span className="ml-auto text-sm font-bold text-teal-600">{simpleWeights[category.id]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simpleWeights[category.id]}
                  onChange={(e) => setSimpleWeights((prev) => ({ ...prev, [category.id]: Number(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Extended mode */}
      {profileType === "extended" && (
        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            const isExpanded = expandedCategories[category.id]
            const catWeights = extendedWeights[category.id]
            const avg = Math.round(
              Object.values(catWeights).reduce((s, v) => s + v, 0) / Object.values(catWeights).length,
            )

            return (
              <div key={category.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="text-lg font-semibold text-slate-800">{category.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-teal-600">Gesamt: {avg}%</span>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-5">
                    {/* Overall bar */}
                    <div className="h-3 rounded-full overflow-hidden flex bg-slate-200">
                      {category.subs.map((sub, i) => (
                        <div
                          key={sub.id}
                          className={`transition-all duration-300 ${i === 0 ? "bg-teal-500" : i === 1 ? "bg-teal-300" : "bg-teal-200"}`}
                          style={{ width: `${catWeights[sub.id] / category.subs.length}%` }}
                        />
                      ))}
                    </div>

                    {category.subs.map((sub, i) => (
                      <div key={sub.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-slate-700 flex-1 pr-4">{sub.label}</label>
                          <span className={`text-sm font-bold w-12 text-right ${i === 0 ? "text-teal-600" : "text-teal-400"}`}>
                            {catWeights[sub.id]}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={catWeights[sub.id]}
                          onChange={(e) =>
                            setExtendedWeights((prev) => ({
                              ...prev,
                              [category.id]: { ...prev[category.id], [sub.id]: Number(e.target.value) },
                            }))
                          }
                          className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${i === 0 ? "accent-teal-600" : "accent-teal-300"}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Save button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird gespeichert...</> : "Präferenzen speichern"}
        </button>
      </div>
    </div>
  )
}
