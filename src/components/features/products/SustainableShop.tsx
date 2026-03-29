"use client"

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
  Search,
  Package,
} from "lucide-react"
import { ProductService } from "@/src/services/product.service"
import { CategoryService } from "@/src/services/category.service"
import type { ProductListItem, ProductListParams, CategoryTreeNode } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import RecommendationsWidget from "@/src/components/features/products/RecommendationsWidget"

const sustainabilityFilters = {
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
      "Klimaschutz, Artenvielfalt, Kreislaufwirtschaft",
    ],
  },
  oekonomisch: {
    label: "Ökonomische Nachhaltigkeit",
    icon: Recycle,
    subpoints: ["Faire Löhne in der Lieferkette", "Langfristig tragfähiges Wirtschaften"],
  },
  sozial: {
    label: "Soziale Nachhaltigkeit",
    icon: Heart,
    subpoints: ["Gerechtigkeit, Chancengleichheit", "Faire Arbeitsbedingungen, Menschenrechte"],
  },
}

const importanceScale = [
  { value: "1", label: "Unwichtig" },
  { value: "2", label: "Etwas wichtig" },
  { value: "3", label: "Wichtig" },
  { value: "4", label: "Sehr wichtig" },
]

const sortOptions = [
  { value: "newest", label: "Neueste" },
  { value: "price_asc", label: "Preis: Niedrig → Hoch" },
  { value: "price_desc", label: "Preis: Hoch → Niedrig" },
]

export default function SustainableShop() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [categories, setCategories] = useState<CategoryTreeNode[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)

  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest")
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    sustainability: false,
    categories: true,
  })
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({})
  const [sustainabilityImportance, setSustainabilityImportance] = useState<Record<string, string>>({
    produktqualitaet: "4",
    oekologisch: "4",
    oekonomisch: "3",
    sozial: "3",
  })

  // Debounce search
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [search])

  // Load categories
  useEffect(() => {
    CategoryService.tree()
      .then(setCategories)
      .catch(() => {})
  }, [])

  // Load products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: ProductListParams = {
        page: currentPage,
        size: 12,
        sort: sortBy,
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (selectedCategoryId) params.categoryId = selectedCategoryId
      const page = await ProductService.list(params)
      setProducts(page.content)
      setTotalPages(page.totalPages)
      setTotalElements(page.totalElements)
    } catch {
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, sortBy, debouncedSearch, selectedCategoryId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Reset to page 0 on filter/sort change
  useEffect(() => {
    setCurrentPage(0)
  }, [debouncedSearch, selectedCategoryId, sortBy])

  const handleProductClick = (product: ProductListItem) => {
    window.location.href = product.slug
      ? `/product?slug=${product.slug}`
      : `/product?id=${product.id}`
  }

  return (
    <div>
      {/* Recommendations widget for authenticated buyers */}
      <RecommendationsWidget />

      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        {/* Filters Sidebar */}
        <div className="sticky top-20 h-fit overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-100 p-4">
            <h2 className="text-lg font-semibold text-slate-800">Filter</h2>
          </div>

          {/* Search */}
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Produkte suchen…"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Nachhaltigkeitspräferenzen */}
          <div className="border-b border-slate-200">
            <button
              onClick={() =>
                setExpandedSections((s) => ({ ...s, sustainability: !s.sustainability }))
              }
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
                  Bewerten Sie, wie wichtig Ihnen jeder Aspekt ist.
                </p>
                {Object.entries(sustainabilityFilters).map(([key, filter]) => {
                  const Icon = filter.icon
                  return (
                    <div key={key} className="space-y-2">
                      <button
                        onClick={() =>
                          setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }))
                        }
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
                            {filter.subpoints.map((sp, i) => (
                              <li key={i}>{sp}</li>
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
                          onChange={(e) =>
                            setSustainabilityImportance((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
                        />
                        <span className="w-24 text-right text-xs text-slate-500">
                          {
                            importanceScale.find((s) => s.value === sustainabilityImportance[key])
                              ?.label
                          }
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Kategorien */}
          <div>
            <button
              onClick={() => setExpandedSections((s) => ({ ...s, categories: !s.categories }))}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">Kategorien</span>
              {expandedSections.categories ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>
            {expandedSections.categories && (
              <div className="flex flex-col gap-1 px-4 pb-4">
                <button
                  onClick={() => setSelectedCategoryId(undefined)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${!selectedCategoryId ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  Alle
                </button>
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <button
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${selectedCategoryId === cat.id ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      {cat.name}
                    </button>
                    {cat.children?.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedCategoryId(sub.id)}
                        className={`w-full rounded-md py-1.5 pl-7 pr-3 text-left text-sm transition-colors ${selectedCategoryId === sub.id ? "bg-teal-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-slate-600">
              {isLoading ? (
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-teal-600" />
              ) : (
                <span className="font-medium">{totalElements}</span>
              )}{" "}
              Produkte gefunden
            </p>
            <div className="relative">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm transition-colors hover:bg-slate-50"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sortieren
              </button>
              {isSortDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-52 rounded-lg border border-slate-200 bg-white shadow-lg">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value as typeof sortBy)
                        setIsSortDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${sortBy === opt.value ? "bg-slate-100 font-medium" : ""}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <div className="aspect-square bg-slate-200" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-1/3 rounded bg-slate-200" />
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="mb-4 h-16 w-16 text-slate-300" />
              <h3 className="mb-2 text-xl font-semibold text-slate-700">Keine Produkte gefunden</h3>
              <p className="text-slate-500">Versuchen Sie andere Filtereinstellungen.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const imageUrl = (product as unknown as { imageUrl?: string }).imageUrl
                const category = (product as unknown as { categoryName?: string }).categoryName
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-200">
                          <Package className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      {category && (
                        <p className="text-xs font-medium uppercase tracking-wide text-teal-600">
                          {category}
                        </p>
                      )}
                      <h3 className="line-clamp-2 text-sm font-medium text-slate-800">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-bold text-slate-800">
                          {formatEuro(product.price ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Vorherige
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg border px-4 py-2 text-sm ${
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
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
