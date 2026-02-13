"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Star, Leaf, Recycle, Heart, Shield, Globe, Cpu, Building } from "lucide-react"

type CategoryWeights = {
  [key: string]: {
    sub1: number
    sub2: number
  }
}

const categories = [
  {
    id: "produktqualitaet",
    title: "Produktqualität",
    icon: Star,
    sub1: "Qualitätsparameter",
    sub2: "Schadstofffreiheit",
  },
  {
    id: "oekologisch",
    title: "Ökologische Nachhaltigkeit",
    icon: Leaf,
    sub1: "Schutz von Umwelt, Natur und Ressourcen",
    sub2: "Fokus auf Klimaschutz, Artenvielfalt, Ressourcenschonung, erneuerbare Energien",
  },
  {
    id: "oekonomisch",
    title: "Ökonomische Nachhaltigkeit",
    icon: Recycle,
    sub1: "Wirtschaftliches Handeln so gestalten, dass es langfristig tragfähig ist",
    sub2: "Förderung von Stabilität, Innovation, verantwortungsvollem Wachstum",
  },
  {
    id: "sozial",
    title: "Soziale Nachhaltigkeit",
    icon: Heart,
    sub1: "Gerechtigkeit, Chancengleichheit, soziale Sicherheit",
    sub2: "Menschenrechte, Bildung, Gesundheit, faire Arbeitsbedingungen",
  },
  {
    id: "kulturell",
    title: "Kulturelle Nachhaltigkeit",
    icon: Globe,
    sub1: "Erhalt kultureller Vielfalt, Traditionen und Identitäten",
    sub2: "Unterstützung lokaler Kulturen im Globalisierungsprozess",
  },
  {
    id: "politisch",
    title: "Politische Nachhaltigkeit",
    icon: Shield,
    sub1: "Demokratische Strukturen, Rechtsstaatlichkeit, Mitbestimmung",
    sub2: "Gute Regierungsführung (Good Governance), transparente Entscheidungen",
  },
  {
    id: "technologisch",
    title: "Technologische Nachhaltigkeit",
    icon: Cpu,
    sub1: "Förderung und Nutzung umweltfreundlicher und effizienter Technologien",
    sub2: "Technikfolgenabschätzung, Innovation im Einklang mit Umwelt und Gesellschaft",
  },
  {
    id: "institutionell",
    title: "Institutionelle Nachhaltigkeit",
    icon: Building,
    sub1: "Aufbau tragfähiger Institutionen, die nachhaltige Entwicklung langfristig sichern",
    sub2: "Integration von Nachhaltigkeit in Verwaltung, Bildung, Unternehmen",
  },
]

export default function Praeferenzen() {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [weights, setWeights] = useState<CategoryWeights>(() => {
    const initial: CategoryWeights = {}
    categories.forEach((cat) => {
      initial[cat.id] = { sub1: 50, sub2: 50 }
    })
    return initial
  })

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleSliderChange = (categoryId: string, subpoint: "sub1" | "sub2", value: number) => {
    setWeights((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [subpoint]: value,
      },
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Präferenzen</h1>
        <p className="text-slate-600">
          Passen Sie Ihre Nachhaltigkeitspräferenzen an. Verschieben Sie die Regler, um die Gewichtung der einzelnen
          Aspekte festzulegen.
        </p>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = category.icon
          const isExpanded = expandedCategories[category.id]
          const categoryWeights = weights[category.id]
          const categoryPercent = Math.round((categoryWeights.sub1 + categoryWeights.sub2) / 2)

          return (
            <div key={category.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Category Header */}
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
                  <span className="text-sm font-bold text-teal-600">Gesamt: {categoryPercent}%</span>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-6">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Gesamtwert: {categoryPercent}%</span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden flex bg-slate-200">
                      <div
                        className="bg-teal-500 transition-all duration-300"
                        style={{ width: `${categoryWeights.sub1 / 2}%` }}
                      />
                      <div
                        className="bg-teal-300 transition-all duration-300"
                        style={{ width: `${categoryWeights.sub2 / 2}%` }}
                      />
                    </div>
                  </div>

                  {/* Subpoint 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700 flex-1 pr-4">{category.sub1}</label>
                      <span className="text-sm font-bold text-teal-600 w-12 text-right">{categoryWeights.sub1}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={categoryWeights.sub1}
                      onChange={(e) => handleSliderChange(category.id, "sub1", Number.parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  {/* Subpoint 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700 flex-1 pr-4">{category.sub2}</label>
                      <span className="text-sm font-bold text-teal-300 w-12 text-right">{categoryWeights.sub2}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={categoryWeights.sub2}
                      onChange={(e) => handleSliderChange(category.id, "sub2", Number.parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-300"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => console.log("Exakte Auswahl clicked")}
          className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          Exakte Auswahl
        </button>
      </div>
    </div>
  )
}
