"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Leaf,
  Heart,
  Recycle,
  ArrowUpDown,
  Star,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Search,
  UserCircle,
  ShieldCheck,
  Users,
  Layers,
  Home,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { formatEuro } from "@/src/lib/currency"
import type { ProductDetail } from "@/src/types"
import type { CertificateType } from "@/src/types/certificate"
import { useProducts, PRODUCTS_PAGE_SIZE } from "@/src/hooks/useProducts"
import { useAuth } from "@/src/context/AuthContext"
import { useBuyerValueProfile } from "@/src/hooks/useBuyerValueProfile"
import { sellerUrl } from "@/src/lib/seller-url"

// ── Sustainability filter config ───────────────────────────────────────────────

type SustainabilityFilter = {
  label: string
  icon: typeof Leaf
  subpoints: string[]
}

const sustainabilityFilters: Record<string, SustainabilityFilter> = {
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

const importanceScale = [
  { value: "1", label: "Unwichtig" },
  { value: "2", label: "Wenig wichtig" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Wichtig" },
  { value: "5", label: "Sehr wichtig" },
]

function profileWeightToSlider(weight: number): string {
  return String(Math.min(5, Math.max(1, Math.round((weight / 100) * 4 + 1))))
}

const MIDDLE_IMPORTANCE: Record<string, string> = Object.keys(sustainabilityFilters).reduce(
  (acc, key) => ({ ...acc, [key]: "3" }),
  {}
)

// ── Sort options ───────────────────────────────────────────────────────────────

const sortOptions = [
  { value: "newest", label: "Neueste", apiSort: "newest" },
  { value: "price-low", label: "Preis: Niedrig → Hoch", apiSort: "price_asc" },
  { value: "price-high", label: "Preis: Hoch → Niedrig", apiSort: "price_desc" },
]

// ── Category chips ─────────────────────────────────────────────────────────────

const categoryChips: { label: string; icon: typeof Leaf; query: string }[] = [
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

function certLabel(type: CertificateType | undefined): string {
  return type ? (certTypeLabels[type] ?? type) : "Zertifiziert"
}

function certStyle(type: CertificateType | undefined): string {
  return type
    ? (certTypeStyles[type] ?? "bg-stone-100 text-stone-600")
    : "bg-stone-100 text-stone-600"
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SustainableShop() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { data: valueProfile } = useBuyerValueProfile(isAuthenticated)
  const shopRef = useRef<HTMLDivElement>(null)

  // ── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: 300 })
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(0)
  const [sustainabilityImportance, setSustainabilityImportance] =
    useState<Record<string, string>>(MIDDLE_IMPORTANCE)

  useEffect(() => {
    if (!isAuthenticated || !valueProfile?.simpleProfile) {
      setSustainabilityImportance(MIDDLE_IMPORTANCE)
      return
    }
    const fromProfile = Object.keys(sustainabilityFilters).reduce<Record<string, string>>(
      (acc, key) => {
        const weight = valueProfile.simpleProfile![key]
        return { ...acc, [key]: weight != null ? profileWeightToSlider(weight) : "2" }
      },
      {}
    )
    setSustainabilityImportance(fromProfile)
  }, [valueProfile, isAuthenticated])

  // ── UI state ───────────────────────────────────────────────────────
  const [expandedSections, setExpandedSections] = useState({
    sustainability: true,
    categories: false,
  })
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({})
  const [expandedFilterSections, setExpandedFilterSections] = useState({ price: true })
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)

  // ── Debounce search ────────────────────────────────────────────────
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value)
      setCurrentPage(0)
    }, 400)
  }

  const applyCategory = (query: string) => {
    setSearch(query)
    setDebouncedSearch(query)
    setCurrentPage(0)
    shopRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const resetFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setPriceRange({ min: 0, max: 300 })
    setCurrentPage(0)
  }

  // ── Data via React Query ───────────────────────────────────────────
  const apiSort = sortOptions.find((o) => o.value === sortBy)?.apiSort
  const { data, isLoading, isFetching, error, refetch } = useProducts({
    search: debouncedSearch,
    priceRange,
    apiSort,
    currentPage,
  })
  const products: ProductDetail[] = data?.products ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0

  // ── Handlers ───────────────────────────────────────────────────────
  const handleImportanceChange = (attribute: string, importance: string) => {
    setSustainabilityImportance((prev) => ({ ...prev, [attribute]: importance }))
  }

  const toggleSection = (key: "sustainability" | "categories") => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleFilterExpansion = (key: string) => {
    setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getImportanceLabel = (value: string) => {
    return importanceScale.find((scale) => scale.value === value)?.label ?? ""
  }

  const handleProductClick = (slug: string | undefined, id: string) => {
    router.push(slug ? `/product?slug=${slug}` : `/product?id=${id}`)
  }

  const handleSellerClick = (e: React.MouseEvent, sellerId: string | undefined) => {
    e.stopPropagation()
    if (sellerId) router.push(`/producer?id=${sellerId}`)
  }

  const getProductImage = (product: ProductDetail): string => {
    return product.images?.[0]?.url ?? product.imageUrls?.[0] ?? "/placeholder.svg"
  }

  const getProductPrice = (product: ProductDetail): number => {
    return product.basePrice ?? product.price ?? 0
  }

  const getSellerName = (product: ProductDetail): string | null => {
    if (!product.seller) return null
    return (
      product.seller.companyName ??
      (product.seller.firstName && product.seller.lastName
        ? `${product.seller.firstName} ${product.seller.lastName}`
        : null)
    )
  }

  const activeSortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? "Sortieren"

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative mb-8 animate-fade-up overflow-hidden rounded-2xl border border-sage-100 bg-gradient-to-br from-sage-50 via-white to-bark-50 px-8 py-10 sm:py-14">
        {/* Decorative background circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sage-100/40" />
        <div className="pointer-events-none absolute -bottom-10 right-24 h-40 w-40 rounded-full bg-bark-100/30" />

        <div className="relative max-w-lg">
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-sage-600">
            Nachhaltiger Marktplatz
          </span>
          <h1 className="animate-fade-up-1 mb-4 text-3xl font-bold leading-tight text-stone-900 sm:text-4xl">
            Einkaufen mit
            <br />
            gutem Gewissen
          </h1>
          <p className="animate-fade-up-2 mb-6 max-w-sm text-base leading-relaxed text-stone-500">
            Produkte, die fair hergestellt, zertifiziert und für die Zukunft gedacht sind.
          </p>
          <div className="animate-fade-up-3 flex flex-wrap gap-3">
            <button
              onClick={() => shopRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-xl bg-sage-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sage-700"
            >
              Jetzt entdecken
            </button>
            <Link
              href="/about"
              className="rounded-xl border border-bark-300 px-5 py-2.5 text-sm font-semibold text-bark-700 transition-colors hover:bg-bark-50"
            >
              Mehr erfahren
            </Link>
          </div>
        </div>
      </div>

      {/* ── Trust Bar ─────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: ShieldCheck, label: "Geprüfte Zertifikate", sub: "100% verifiziert" },
          { icon: Leaf, label: "Bio & Fair Trade", sub: "Nachhaltige Qualität" },
          { icon: Users, label: "Direkt vom Hersteller", sub: "Keine Zwischenhändler" },
          { icon: Recycle, label: "Kreislaufwirtschaft", sub: "Ressourcenschonend" },
        ].map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-xl border border-stone-100 bg-white px-4 py-4 text-center shadow-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage-50">
              <Icon className="h-4 w-4 text-sage-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-700">{label}</p>
              <p className="text-[11px] text-stone-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category Chips ────────────────────────────────────────────── */}
      <div className="scrollbar-hide mb-8 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={resetFilters}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
            !debouncedSearch
              ? "border-sage-300 bg-sage-600 text-white"
              : "border-stone-200 bg-white text-stone-600 hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700"
          }`}
        >
          Alle
        </button>
        {categoryChips.map(({ label, icon: Icon, query }) => (
          <button
            key={label}
            onClick={() => applyCategory(query)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
              debouncedSearch === query
                ? "border-sage-300 bg-sage-600 text-white"
                : "border-stone-200 bg-white text-stone-600 hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <div ref={shopRef} className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Produkte suchen…"
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-100"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* ── Filters Sidebar ──────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 bg-stone-50/60 px-4 py-3.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Filter
            </h2>
          </div>

          {/* Nachhaltigkeitspräferenzen */}
          <div className="border-b border-stone-100">
            <button
              onClick={() => toggleSection("sustainability")}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-stone-50"
            >
              <div className="flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5 text-sage-600" />
                <span className="text-sm font-medium text-stone-700">
                  Nachhaltigkeitspräferenzen
                </span>
                <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-400">
                  Bald verfügbar
                </span>
              </div>
              {expandedSections.sustainability ? (
                <ChevronDown className="h-4 w-4 text-stone-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-stone-400" />
              )}
            </button>
            {expandedSections.sustainability && (
              <div className="pointer-events-none space-y-4 px-4 pb-4 opacity-50">
                {isAuthenticated && valueProfile?.simpleProfile ? (
                  <div className="flex items-center gap-1.5 rounded-lg bg-sage-50 px-2.5 py-1.5 text-xs text-sage-700">
                    <UserCircle className="h-3.5 w-3.5" />
                    <span>Aus deinem Werteprofil</span>
                  </div>
                ) : (
                  <p className="text-xs text-stone-400">
                    Wie wichtig ist dir jeder Nachhaltigkeitsaspekt?
                  </p>
                )}
                {Object.entries(sustainabilityFilters).map(([key, filter]) => {
                  const Icon = filter.icon
                  return (
                    <div key={key} className="space-y-2">
                      <button
                        onClick={() => toggleFilterExpansion(key)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-sage-600" />
                          <span className="text-sm text-stone-600">{filter.label}</span>
                        </div>
                        {expandedFilters[key] ? (
                          <ChevronDown className="h-3.5 w-3.5 text-stone-300" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
                        )}
                      </button>

                      {expandedFilters[key] && (
                        <div className="ml-5 rounded-lg bg-sage-50/60 p-2.5 text-xs text-stone-500">
                          <ul className="list-inside list-disc space-y-1">
                            {filter.subpoints.map((subpoint, idx) => (
                              <li key={idx}>{subpoint}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="ml-5 flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={sustainabilityImportance[key]}
                          onChange={(e) => handleImportanceChange(key, e.target.value)}
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-sage-600"
                        />
                        <span className="w-20 shrink-0 text-right text-xs text-stone-400">
                          {getImportanceLabel(sustainabilityImportance[key])}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Preisspanne */}
          <div>
            <button
              onClick={() => setExpandedFilterSections((prev) => ({ ...prev, price: !prev.price }))}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-stone-50"
            >
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-sage-600" />
                <span className="text-sm font-medium text-stone-700">Preisspanne</span>
              </div>
              {expandedFilterSections.price ? (
                <ChevronDown className="h-4 w-4 text-stone-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-stone-400" />
              )}
            </button>
            {expandedFilterSections.price && (
              <div className="space-y-4 px-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-stone-400">Min (€)</label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => {
                        setPriceRange((prev) => ({ ...prev, min: Number(e.target.value) }))
                        setCurrentPage(0)
                      }}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100"
                      placeholder="0"
                    />
                  </div>
                  <span className="mt-5 text-stone-300">–</span>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-stone-400">Max (€)</label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => {
                        setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))
                        setCurrentPage(0)
                      }}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:border-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-100"
                      placeholder="300"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={priceRange.max}
                  onChange={(e) => {
                    setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))
                    setCurrentPage(0)
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-sage-600"
                />
                <p className="text-right text-xs text-stone-400">
                  bis {formatEuro(priceRange.max)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Products Section ─────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm text-stone-500">
              {isLoading ? (
                <span className="text-stone-400">Lädt…</span>
              ) : (
                <>
                  <span className="font-semibold text-stone-700">{totalElements}</span> Produkte
                  {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-300" />}
                </>
              )}
            </p>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {activeSortLabel}
              </button>
              {isSortDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setCurrentPage(0)
                        setIsSortDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-stone-50 ${
                        sortBy === option.value
                          ? "bg-sage-50 font-medium text-sage-700"
                          : "text-stone-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Skeleton — shown only on first load */}
          {isLoading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: PRODUCTS_PAGE_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-stone-100 bg-white shadow-sm"
                >
                  <div className="aspect-square animate-pulse bg-sage-50" />
                  <div className="space-y-2.5 p-4">
                    <div className="h-3 w-1/3 animate-pulse rounded-full bg-sage-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-stone-100" />
                    <div className="h-3 w-full animate-pulse rounded-full bg-stone-100" />
                    <div className="flex gap-1.5 pt-1">
                      <div className="h-4 w-12 animate-pulse rounded-full bg-sage-100" />
                      <div className="h-4 w-14 animate-pulse rounded-full bg-amber-100" />
                    </div>
                    <div className="mt-1 h-5 w-1/4 animate-pulse rounded-full bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-300" />
              </div>
              <div className="text-center">
                <p className="font-medium text-stone-700">Produkte konnten nicht geladen werden</p>
                <p className="mt-1 text-sm text-stone-400">Bitte überprüfe deine Verbindung</p>
              </div>
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-bark-700 px-4 py-2 text-sm font-medium text-white hover:bg-bark-800"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && products.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <Leaf className="h-8 w-8 text-stone-300" />
              </div>
              <div className="text-center">
                <p className="font-medium text-stone-700">Keine Produkte gefunden</p>
                <p className="mt-1 text-sm text-stone-400">
                  Versuche andere Suchbegriffe oder passe die Filter an
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="text-sm font-medium text-sage-600 hover:underline"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && products.length > 0 && (
            <div
              className={`grid gap-5 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isFetching ? "opacity-60" : "opacity-100"}`}
            >
              {products.map((product) => {
                const sellerName = getSellerName(product)
                const image = getProductImage(product)
                const price = getProductPrice(product)
                const certs = product.certificates ?? []
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.slug, product.id)}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sage-200 hover:shadow-lg"
                  >
                    {/* Product image */}
                    <div className="relative aspect-square overflow-hidden bg-sage-50">
                      <img
                        src={image}
                        alt={product.name ?? product.title ?? "Produkt"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Certificate count badge */}
                      {certs.length > 0 && (
                        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-sage-700 shadow-sm backdrop-blur-sm">
                          <ShieldCheck className="h-3 w-3" />
                          {certs.length}
                        </div>
                      )}

                      {/* Category badge */}
                      {product.category?.name && (
                        <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-stone-600 shadow-sm backdrop-blur-sm">
                          {product.category.name}
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="space-y-1.5 p-4">
                      {sellerName && (
                        <button
                          onClick={(e) => handleSellerClick(e, product.seller?.userId)}
                          className="text-xs font-semibold uppercase tracking-wider text-sage-600 hover:text-sage-700 hover:underline"
                        >
                          {sellerName}
                        </button>
                      )}
                      <h3 className="line-clamp-1 text-sm font-semibold text-stone-800">
                        {product.name ?? product.title}
                      </h3>
                      {product.shortDesc && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-stone-400">
                          {product.shortDesc}
                        </p>
                      )}

                      {/* Certificate chips */}
                      {certs.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {certs.slice(0, 2).map((cert) => (
                            <span
                              key={cert.id}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${certStyle(cert.certificateType)}`}
                            >
                              {certLabel(cert.certificateType)}
                            </span>
                          ))}
                          {certs.length > 2 && (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                              +{certs.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-base font-bold text-stone-900">
                          {formatEuro(price)}
                        </span>
                        <span className="text-[10px] font-medium text-sage-600">Auf Lager</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
              >
                Vorherige
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg border px-4 py-2 text-sm shadow-sm transition-colors ${
                      page === currentPage
                        ? "border-sage-600 bg-sage-600 text-white"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {page + 1}
                  </button>
                )
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
              >
                Nächste
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
