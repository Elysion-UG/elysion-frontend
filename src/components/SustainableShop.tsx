"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
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
} from "lucide-react"
import { ProductService } from "@/src/services/product.service"
import { formatEuro } from "@/src/lib/currency"
import type { ProductDetail } from "@/src/types"

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
  { value: "2", label: "Etwas wichtig" },
  { value: "3", label: "Wichtig" },
  { value: "4", label: "Sehr wichtig" },
]

// ── Sort options ──────────────────────────────────────────────────────────────

const sortOptions = [
  { value: "newest", label: "Neueste", apiSort: "newest" },
  { value: "price-low", label: "Preis: Niedrig → Hoch", apiSort: "price_asc" },
  { value: "price-high", label: "Preis: Hoch → Niedrig", apiSort: "price_desc" },
]

const PAGE_SIZE = 12

// ── Component ─────────────────────────────────────────────────────────────────

export default function SustainableShop() {
  // ── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: 300 })
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(0)
  const [sustainabilityImportance, setSustainabilityImportance] = useState<Record<string, string>>({
    produktqualitaet: "4",
    oekologisch: "4",
    oekonomisch: "3",
    sozial: "3",
    kulturell: "2",
    politisch: "2",
    technologisch: "3",
    institutionell: "2",
  })

  // ── UI state ───────────────────────────────────────────────────────
  const [expandedSections, setExpandedSections] = useState({
    sustainability: false,
    categories: false,
  })
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({})
  const [expandedFilterSections, setExpandedFilterSections] = useState({ price: true })
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)

  // ── Data state ─────────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductDetail[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // ── Fetch products ─────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const apiSort = sortOptions.find((o) => o.value === sortBy)?.apiSort
      const page = await ProductService.list({
        search: debouncedSearch || undefined,
        minPrice: priceRange.min > 0 ? priceRange.min : undefined,
        maxPrice: priceRange.max < 300 ? priceRange.max : undefined,
        sort: apiSort,
        page: currentPage,
        size: PAGE_SIZE,
      })
      setProducts(page.content)
      setTotalElements(page.totalElements)
      setTotalPages(page.totalPages)
    } catch {
      setError("Produkte konnten nicht geladen werden.")
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, priceRange, sortBy, currentPage])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

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
    window.location.href = slug ? `/product?slug=${slug}` : `/product?id=${id}`
  }

  const handleSellerClick = (e: React.MouseEvent, sellerId: string | undefined) => {
    e.stopPropagation()
    if (sellerId) window.location.href = `/producer?id=${sellerId}`
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
      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Produkte suchen…"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        {/* ── Filters Sidebar ──────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-100 p-4">
            <h2 className="text-lg font-semibold text-slate-800">Filter</h2>
          </div>

          {/* Nachhaltigkeitspräferenzen */}
          <div className="border-b border-slate-200">
            <button
              onClick={() => toggleSection("sustainability")}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">Nachhaltigkeitspräferenzen</span>
              {expandedSections.sustainability ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>
            {expandedSections.sustainability && (
              <div className="space-y-4 px-4 pb-4">
                <p className="text-sm text-slate-500">
                  Bewerten Sie, wie wichtig Ihnen jeder Nachhaltigkeitsaspekt ist.
                </p>
                {Object.entries(sustainabilityFilters).map(([key, filter]) => {
                  const Icon = filter.icon
                  return (
                    <div key={key} className="space-y-2">
                      <button
                        onClick={() => toggleFilterExpansion(key)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-teal-600" />
                          <span className="text-sm font-medium text-slate-700">{filter.label}</span>
                        </div>
                        {expandedFilters[key] ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </button>

                      {expandedFilters[key] && (
                        <div className="ml-6 rounded bg-slate-50 p-2 text-xs text-slate-600">
                          <ul className="list-inside list-disc space-y-1">
                            {filter.subpoints.map((subpoint, idx) => (
                              <li key={idx}>{subpoint}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="ml-6 flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="4"
                          value={sustainabilityImportance[key]}
                          onChange={(e) => handleImportanceChange(key, e.target.value)}
                          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
                        />
                        <span className="w-24 text-right text-xs text-slate-500">
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
          <div className="border-b border-slate-200">
            <button
              onClick={() => setExpandedFilterSections((prev) => ({ ...prev, price: !prev.price }))}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">Preisspanne</span>
              {expandedFilterSections.price ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>
            {expandedFilterSections.price && (
              <div className="space-y-4 px-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-slate-500">Min (€)</label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => {
                        setPriceRange((prev) => ({ ...prev, min: Number(e.target.value) }))
                        setCurrentPage(0)
                      }}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <span className="mt-5 text-slate-400">–</span>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-slate-500">Max (€)</label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => {
                        setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))
                        setCurrentPage(0)
                      }}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Products Section ─────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-slate-600">
              {isLoading ? (
                <span className="text-slate-400">Lädt…</span>
              ) : (
                <>
                  <span className="font-medium">{totalElements}</span> Produkte gefunden
                </>
              )}
            </p>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 transition-colors hover:bg-slate-50"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="text-sm">{activeSortLabel}</span>
              </button>
              {isSortDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-52 rounded-lg border border-slate-200 bg-white shadow-lg">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setCurrentPage(0)
                        setIsSortDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                        sortBy === option.value ? "bg-slate-100 font-medium" : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-slate-600">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <p>{error}</p>
              <button
                onClick={fetchProducts}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && products.length === 0 && (
            <div className="flex min-h-[300px] items-center justify-center text-slate-500">
              Keine Produkte gefunden.
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && products.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const sellerName = getSellerName(product)
                const image = getProductImage(product)
                const price = getProductPrice(product)
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.slug, product.id)}
                    className="group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={image}
                        alt={product.name ?? product.title ?? "Produkt"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-2 p-4">
                      {sellerName && (
                        <button
                          onClick={(e) => handleSellerClick(e, product.seller?.userId)}
                          className="text-xs font-medium uppercase tracking-wide text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          {sellerName}
                        </button>
                      )}
                      <h3 className="line-clamp-1 font-medium text-slate-800">
                        {product.name ?? product.title}
                      </h3>
                      {product.shortDesc && (
                        <p className="line-clamp-2 text-sm text-slate-500">{product.shortDesc}</p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <span className="font-bold text-slate-800">{formatEuro(price)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Vorherige
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg border px-4 py-2 ${
                      page === currentPage
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page + 1}
                  </button>
                )
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
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
