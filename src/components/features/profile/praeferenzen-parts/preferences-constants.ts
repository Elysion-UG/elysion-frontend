import { Cpu, Globe, Heart, Leaf, Recycle, Shield, Star, type LucideIcon } from "lucide-react"

export interface PreferenceSubcategory {
  id: string
  label: string
}

export interface PreferenceCategory {
  id: string
  title: string
  icon: LucideIcon
  subs: PreferenceSubcategory[]
}

// The canonical list of 7 sustainability dimensions from Module 01 spec.
// IDs must remain stable — they are persisted in the buyer_value_profile table.
export const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  {
    id: "produktqualitaet",
    title: "Produktqualität",
    icon: Star,
    subs: [
      { id: "qualitaetsparameter", label: "Qualitätsparameter" },
      { id: "schadstofffreiheit", label: "Schadstofffreiheit" },
    ],
  },
  {
    id: "oekologisch",
    title: "Ökologische Nachhaltigkeit",
    icon: Leaf,
    subs: [
      { id: "umwelt_schutz", label: "Schutz von Umwelt, Natur und Ressourcen" },
      { id: "klimaschutz", label: "Klimaschutz, Artenvielfalt, Ressourcenschonung" },
    ],
  },
  {
    id: "oekonomisch",
    title: "Ökonomische Nachhaltigkeit",
    icon: Recycle,
    subs: [
      {
        id: "langfristig_tragfaehig",
        label: "Wirtschaftliches Handeln langfristig tragfähig gestalten",
      },
      { id: "innovation", label: "Stabilität, Innovation, verantwortungsvolles Wachstum" },
    ],
  },
  {
    id: "sozial",
    title: "Soziale Nachhaltigkeit",
    icon: Heart,
    subs: [
      { id: "gerechtigkeit", label: "Gerechtigkeit, Chancengleichheit, soziale Sicherheit" },
      { id: "menschenrechte", label: "Menschenrechte, Bildung, Gesundheit, faire Arbeit" },
    ],
  },
  {
    id: "kulturell",
    title: "Kulturelle Nachhaltigkeit",
    icon: Globe,
    subs: [
      { id: "kulturelle_vielfalt", label: "Erhalt kultureller Vielfalt und Traditionen" },
      { id: "lokale_kulturen", label: "Unterstützung lokaler Kulturen" },
    ],
  },
  {
    id: "politisch",
    title: "Politische Nachhaltigkeit",
    icon: Shield,
    subs: [
      { id: "demokratie", label: "Demokratische Strukturen, Rechtsstaatlichkeit" },
      { id: "good_governance", label: "Gute Regierungsführung, transparente Entscheidungen" },
    ],
  },
  {
    id: "technologisch",
    title: "Technologische Nachhaltigkeit",
    icon: Cpu,
    subs: [
      { id: "umweltfreundliche_tech", label: "Umweltfreundliche und effiziente Technologien" },
      { id: "technikfolgen", label: "Technikfolgenabschätzung, Innovation im Einklang" },
      { id: "digitalisierung", label: "Nachhaltige Digitalisierung" },
    ],
  },
]

export function defaultSimpleWeights(): Record<string, number> {
  return Object.fromEntries(PREFERENCE_CATEGORIES.map((c) => [c.id, 50]))
}

export function defaultExtendedWeights(): Record<string, Record<string, number>> {
  return Object.fromEntries(
    PREFERENCE_CATEGORIES.map((c) => [c.id, Object.fromEntries(c.subs.map((s) => [s.id, 50]))])
  )
}
