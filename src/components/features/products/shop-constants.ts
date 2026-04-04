import type { CertificateType } from "@/src/types/certificate"
import { Leaf, Heart, Recycle, Star, Layers, Home, Sparkles } from "lucide-react"

// ── Sustainability filter config ───────────────────────────────────────────────

export type SustainabilityFilter = {
  label: string
  icon: typeof Leaf
  subpoints: string[]
}

export const sustainabilityFilters: Record<string, SustainabilityFilter> = {
  produktqualitaet: {
    label: "Produktqualität",
    icon: Star,
    subpoints: ["Qualitätsparameter", "Schadstofffreiheit", "Haltbarkeit"],
  },
  oekologisch: {
    label: "Ökologische Nachhaltigkeit",
    icon: Leaf,
    subpoints: [
      "Schutz von Umwelt, Natur und Ressourcen",
      "Fokus auf Klimaschutz, Artenvielfalt, Ressourcenschonung, Kreislaufwirtschaft",
    ],
  },
  oekonomisch: {
    label: "Ökonomische Nachhaltigkeit",
    icon: Recycle,
    subpoints: [
      "Lieferantenbeziehungen",
      "Faire Löhne in der Lieferkette",
      "Wirtschaftliches Handeln so gestalten, dass es langfristig tragfähig ist",
    ],
  },
  sozial: {
    label: "Soziale Nachhaltigkeit",
    icon: Heart,
    subpoints: [
      "Gerechtigkeit, Chancengleichheit, soziale Sicherheit",
      "Menschenrechte, Bildung, Gesundheit, faire Arbeitsbedingungen",
    ],
  },
  kulturell: {
    label: "Kulturelle Nachhaltigkeit",
    icon: Heart,
    subpoints: [
      "Erhalt kultureller Vielfalt, Traditionen und Identitäten",
      "Unterstützung lokaler Kulturen im Globalisierungsprozess",
    ],
  },
  politisch: {
    label: "Politische Nachhaltigkeit",
    icon: Leaf,
    subpoints: [
      "Demokratische Strukturen, Rechtsstaatlichkeit, Mitbestimmung",
      "Firmensitz und Produktionsstandorte",
    ],
  },
  technologisch: {
    label: "Technologische Nachhaltigkeit",
    icon: Recycle,
    subpoints: [
      "Förderung und Nutzung umweltfreundlicher und effizienter Technologien",
      "Innovation im Einklang mit Umwelt und Gesellschaft",
    ],
  },
  institutionell: {
    label: "Institutionelle Nachhaltigkeit",
    icon: Star,
    subpoints: [
      "Unterstützung von Institutionen, die nachhaltig wirken",
      "Integration von Nachhaltigkeit im Unternehmen",
    ],
  },
}

export const importanceScale = [
  { value: "1", label: "Unwichtig" },
  { value: "2", label: "Wenig wichtig" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Wichtig" },
  { value: "5", label: "Sehr wichtig" },
]

export function profileWeightToSlider(weight: number): string {
  return String(Math.min(5, Math.max(1, Math.round((weight / 100) * 4 + 1))))
}

export const MIDDLE_IMPORTANCE: Record<string, string> = Object.keys(sustainabilityFilters).reduce(
  (acc, key) => ({ ...acc, [key]: "3" }),
  {}
)

// ── Sort options ───────────────────────────────────────────────────────────────

export const sortOptions = [
  { value: "newest", label: "Neueste", apiSort: "newest" },
  { value: "price-low", label: "Preis: Niedrig → Hoch", apiSort: "price_asc" },
  { value: "price-high", label: "Preis: Hoch → Niedrig", apiSort: "price_desc" },
]

// ── Category chips ─────────────────────────────────────────────────────────────

export const categoryChips: { label: string; icon: typeof Leaf; query: string }[] = [
  { label: "Textilien", icon: Layers, query: "Textil" },
  { label: "Accessoires", icon: Star, query: "Accessoire" },
  { label: "Bio & Natur", icon: Leaf, query: "Bio" },
  { label: "Haushalt", icon: Home, query: "Haushalt" },
  { label: "Beauty", icon: Sparkles, query: "Beauty" },
  { label: "Fair Trade", icon: Heart, query: "Fair" },
]

// ── Certificate helpers ────────────────────────────────────────────────────────

const certTypeLabels: Record<CertificateType, string> = {
  ORGANIC: "Bio",
  FAIR_TRADE: "Fairtrade",
  RECYCLED: "Recycled",
  VEGAN: "Vegan",
}

const certTypeStyles: Record<CertificateType, string> = {
  ORGANIC: "bg-sage-100 text-sage-700",
  FAIR_TRADE: "bg-amber-100 text-amber-700",
  RECYCLED: "bg-sky-100 text-sky-700",
  VEGAN: "bg-emerald-100 text-emerald-700",
}

export function certLabel(type: CertificateType | undefined): string {
  return type ? (certTypeLabels[type] ?? type) : "Zertifiziert"
}

export function certStyle(type: CertificateType | undefined): string {
  return type
    ? (certTypeStyles[type] ?? "bg-stone-100 text-stone-600")
    : "bg-stone-100 text-stone-600"
}
