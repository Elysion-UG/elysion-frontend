import type { CertificateType } from "@/src/types/certificate"
import { Globe, Landmark, Sprout, Heart, Recycle, Star, Layers, Home, Sparkles } from "lucide-react"

// ── Sustainability filter config ───────────────────────────────────────────────

export type SustainabilityFilter = {
  label: string
  icon: typeof Star
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
    icon: Globe,
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
    icon: Landmark,
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

// Default price bounds of the shop filter — a range narrower than this counts as
// an active filter (used for the mobile "Filter (N)" badge, #78).
export const DEFAULT_PRICE_RANGE = { min: 0, max: 300 } as const

/**
 * Number of *active* filters in the FilterSidebar — materials, a narrowed price
 * range, and any sustainability slider moved off its neutral middle value.
 * Drives the count on the mobile filter trigger (#78). Search is excluded: it
 * has its own search bar, not part of the sidebar.
 */
export function countActiveFilters(args: {
  selectedMaterials: string[]
  priceRange: { min: number; max: number }
  sustainabilityImportance: Record<string, string>
}): number {
  const { selectedMaterials, priceRange, sustainabilityImportance } = args
  const priceNarrowed =
    priceRange.min > DEFAULT_PRICE_RANGE.min || priceRange.max < DEFAULT_PRICE_RANGE.max
  const movedSliders = Object.keys(sustainabilityImportance).filter(
    (key) => sustainabilityImportance[key] !== MIDDLE_IMPORTANCE[key]
  ).length
  return selectedMaterials.length + (priceNarrowed ? 1 : 0) + movedSliders
}

// ── Sort options ───────────────────────────────────────────────────────────────

export const sortOptions = [
  { value: "newest", label: "Neueste", apiSort: "newest" },
  { value: "price-low", label: "Preis: Niedrig → Hoch", apiSort: "price_asc" },
  { value: "price-high", label: "Preis: Hoch → Niedrig", apiSort: "price_desc" },
]

// ── Category chips ─────────────────────────────────────────────────────────────

export const categoryChips: { label: string; icon: typeof Star; query: string }[] = [
  { label: "Textilien", icon: Layers, query: "Textil" },
  { label: "Accessoires", icon: Star, query: "Accessoire" },
  { label: "Bio & Natur", icon: Sprout, query: "Bio" },
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

// Guide 05 — Zertifikats-Badges folgen einer Logik: einheitliche Pill mit
// Grün-Tint und Ink-Text, keine erfundenen Typ-Farben.
const CERT_BADGE_STYLE = "bg-green-50 text-ink-900"
const certTypeStyles: Record<CertificateType, string> = {
  ORGANIC: CERT_BADGE_STYLE,
  FAIR_TRADE: CERT_BADGE_STYLE,
  RECYCLED: CERT_BADGE_STYLE,
  VEGAN: CERT_BADGE_STYLE,
}

export function certLabel(type: CertificateType | undefined): string {
  return type ? (certTypeLabels[type] ?? type) : "Zertifiziert"
}

export function certStyle(type: CertificateType | undefined): string {
  return type ? (certTypeStyles[type] ?? CERT_BADGE_STYLE) : CERT_BADGE_STYLE
}
