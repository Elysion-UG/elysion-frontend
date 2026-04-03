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
} from "lucide-react"
import { formatEuro } from "@/src/lib/currency"
import type { ProductDetail } from "@/src/types"
import { useProducts, PRODUCTS_PAGE_SIZE } from "@/src/hooks/useProducts"
import { useAuth } from "@/src/context/AuthContext"
import { useBuyerValueProfile } from "@/src/hooks/useBuyerValueProfile"

// ── Sustainability filter config (frontend weighting, displayed only) ─────────

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

// Maps a profile weight (0–100) to a slider step (1–5).
function profileWeightToSlider(weight: number): string {
  return String(Math.min(5, Math.max(1, Math.round((weight / 100) * 4 + 1))))
}

const MIDDLE_IMPORTANCE: Record<string, string> = Object.keys(sustainabilityFilters).reduce(
  (acc, key) => ({ ...acc, [key]: "3" }),
  {}
)

// ── Sort options ──────────────────────────────────────────────────────────────

const sortOptions = [
  { value: "newest", label: "Neueste", apiSort: "newest" },
  { value: "price-low", label: "Preis: Niedrig → Hoch", apiSort: "price_asc" },
  { value: "price-high", label: "Preis: Hoch → Niedrig", apiSort: "price_desc" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function SustainableShop() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { data: valueProfile } = useBuyerValueProfile(isAuthenticated)

  // ── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: 300 })
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(0)
  const [sustainabilityImportance, setSustainabilityImportance] =
    useState<Record<string, string>>(MIDDLE_IMPORTANCE)

  // Sync slider values with the user's value profile whenever it loads or
  // the auth state changes. Falls back to MIDDLE_IMPORTANCE when not logged in
  // or when no profile has been saved yet.
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
      {/* Hero intro */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">Nachhaltig einkaufen</h1>
        <p className="mt-2 text-stone-500">
          Produkte, die fair hergestellt, zertifiziert und für die Zukunft gedacht sind.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Produkte suchen…"
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* ── Filters Sidebar ──────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-4 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
              Filter
            </h2>
          </div>

          {/* Nachhaltigkeitspräferenzen */}
          <div className="border-b border-stone-100">
            <button
              onClick={() => toggleSection("sustainability")}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-stone-50"
            >
              <span className="text-sm font-medium text-stone-700">Nachhaltigkeitspräferenzen</span>
              {expandedSections.sustainability ? (
                <ChevronDown className="h-4 w-4 text-stone-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-stone-400" />
              )}
            </button>
            {expandedSections.sustainability && (
              <div className="space-y-4 px-4 pb-4">
                {isAuthenticated && valueProfile?.simpleProfile ? (
                  <div className="flex items-center gap-1.5 text-xs text-sage-600">
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
                        <div className="ml-5 rounded-lg bg-stone-50 p-2.5 text-xs text-stone-500">
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
              <span className="text-sm font-medium text-stone-700">Preisspanne</span>
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
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200"
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
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200"
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
                className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
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
                      className={`w-full px-4 py-2.5 text-left text-sm text-stone-600 hover:bg-stone-50 ${
                        sortBy === option.value ? "bg-stone-50 font-medium text-stone-900" : ""
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
                  className="overflow-hidden rounded-xl border border-stone-200 bg-white"
                >
                  <div className="aspect-square animate-pulse bg-stone-100" />
                  <div className="space-y-2.5 p-4">
                    <div className="h-3 w-1/3 animate-pulse rounded-full bg-stone-100" />
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-stone-100" />
                    <div className="h-3 w-full animate-pulse rounded-full bg-stone-100" />
                    <div className="mt-2 h-5 w-1/4 animate-pulse rounded-full bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-stone-500">
              <AlertCircle className="h-10 w-10 text-red-300" />
              <p className="text-sm">Produkte konnten nicht geladen werden.</p>
              <button
                onClick={() => refetch()}
                className="rounded-lg bg-bark-700 px-4 py-2 text-sm text-white hover:bg-bark-800"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && products.length === 0 && (
            <div className="flex min-h-[300px] items-center justify-center text-sm text-stone-400">
              Keine Produkte gefunden.
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
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.slug, product.id)}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-white transition-all duration-200 hover:border-stone-300 hover:shadow-md"
                  >
                    <div className="relative aspect-square overflow-hidden bg-stone-100">
                      <img
                        src={image}
                        alt={product.name ?? product.title ?? "Produkt"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-1.5 p-4">
                      {sellerName && (
                        <button
                          onClick={(e) => handleSellerClick(e, product.seller?.userId)}
                          className="text-xs font-medium uppercase tracking-wider text-sage-600 hover:text-sage-700 hover:underline"
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
                      <div className="pt-2">
                        <span className="text-base font-bold text-stone-900">
                          {formatEuro(price)}
                        </span>
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
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
              >
                Vorherige
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                      page === currentPage
                        ? "border-bark-700 bg-bark-700 text-white"
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
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300"
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
