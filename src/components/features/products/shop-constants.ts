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
 * Number of *active* filters in the FilterSidebar — materials, colours, sizes,
 * manufacturers, a narrowed price range, and any sustainability slider moved
 * off its neutral middle value. Drives the count on the mobile filter trigger
 * (#78). Search is excluded: it has its own search bar, not part of the sidebar.
 */
export function countActiveFilters(args: {
  selectedMaterials: string[]
  selectedColors: string[]
  selectedSizes: string[]
  selectedSellerIds: string[]
  priceRange: { min: number; max: number }
  sustainabilityImportance: Record<string, string>
}): number {
  const {
    selectedMaterials,
    selectedColors,
    selectedSizes,
    selectedSellerIds,
    priceRange,
    sustainabilityImportance,
  } = args
  const priceNarrowed =
    priceRange.min > DEFAULT_PRICE_RANGE.min || priceRange.max < DEFAULT_PRICE_RANGE.max
  const movedSliders = Object.keys(sustainabilityImportance).filter(
    (key) => sustainabilityImportance[key] !== MIDDLE_IMPORTANCE[key]
  ).length
  return (
    selectedMaterials.length +
    selectedColors.length +
    selectedSizes.length +
    selectedSellerIds.length +
    (priceNarrowed ? 1 : 0) +
    movedSliders
  )
}

// ── Colour / size facet display (#49) ──────────────────────────────────────────
// Facet values arrive normalised (trimmed, lower case) and free-text — the
// backend deliberately leaves the stored data untouched until canonical values
// land. Display is therefore the frontend's business; the *filter* value always
// stays the original facet string.

/**
 * CSS colour per known German colour name, used for the swatch dot. Values not
 * listed here fall back to a neutral swatch — a missing entry must never hide
 * the option, only its colour preview.
 */
const COLOR_SWATCHES: Record<string, string> = {
  schwarz: "#111111",
  weiss: "#ffffff",
  weiß: "#ffffff",
  grau: "#9ca3af",
  silber: "#c0c0c0",
  rot: "#dc2626",
  bordeaux: "#7f1d1d",
  rosa: "#f9a8d4",
  pink: "#ec4899",
  orange: "#f97316",
  gelb: "#facc15",
  beige: "#e8dcc4",
  creme: "#f5f1e3",
  natur: "#e3d9c6",
  braun: "#8b5e34",
  gruen: "#16a34a",
  grün: "#16a34a",
  oliv: "#6b7a3a",
  tuerkis: "#14b8a6",
  türkis: "#14b8a6",
  blau: "#2563eb",
  navy: "#1e3a5f",
  lila: "#7c3aed",
  violett: "#8b5cf6",
  gold: "#d4af37",
  bunt: "#9ca3af",
}

/** Neutral swatch for facet values we have no colour mapping for. */
export const FALLBACK_SWATCH = "#d1d5db"

/** CSS colour for a facet value's swatch dot; neutral grey when unknown. */
export function colorSwatch(value: string): string {
  return COLOR_SWATCHES[value.trim().toLowerCase()] ?? FALLBACK_SWATCH
}

/**
 * Display label for a colour facet value — capitalised for readability.
 * Never use the result as a filter value: the backend expects the original,
 * normalised string.
 */
export function facetLabel(value: string): string {
  if (value.length === 0) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Display label for a size facet value. Letter sizes (`s`, `m`, `xl`) read as
 * upper case; anything else (numeric or worded) is merely capitalised.
 * Display only — the filter value stays the original string.
 */
export function sizeLabel(value: string): string {
  if (/^[a-z]{1,4}$/.test(value)) return value.toUpperCase()
  return facetLabel(value)
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
