"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { PackageSearch, Loader2, AlertCircle, Search, SlidersHorizontal } from "lucide-react"
import type { ProductDetail } from "@/src/types"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet"
import { useProducts, PRODUCTS_PAGE_SIZE } from "@/src/hooks/useProducts"
import { useMaterials } from "@/src/hooks/useMaterials"
import { useProductFacets } from "@/src/hooks/useProductFacets"
import { useSellerFacets } from "@/src/hooks/useSellerFacets"
import { useAuth } from "@/src/context/AuthContext"
import { useBuyerValueProfile } from "@/src/hooks/useBuyerValueProfile"
import {
  sustainabilityFilters,
  profileWeightToSlider,
  MIDDLE_IMPORTANCE,
  sortOptions,
  countActiveFilters,
} from "./shop-constants"
import HeroBanner from "./HeroBanner"
import TrustBar from "./TrustBar"
import CategoryChips from "./CategoryChips"
import FilterSidebar from "./FilterSidebar"
import SortControls from "./SortControls"
import ProductCard from "./ProductCard"

// ── Component ──────────────────────────────────────────────────────────────────

export default function SustainableShop() {
  const { isAuthenticated } = useAuth()
  const { data: valueProfile } = useBuyerValueProfile(isAuthenticated)
  const shopRef = useRef<HTMLDivElement>(null)

  // ── Filter state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [priceRange, setPriceRange] = useState({ min: 0, max: 300 })
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(0)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const { data: materials } = useMaterials()
  const { data: productFacets } = useProductFacets()
  const { data: sellerFacets } = useSellerFacets()
  const [sustainabilityImportance, setSustainabilityImportance] =
    useState<Record<string, string>>(MIDDLE_IMPORTANCE)

  useEffect(() => {
    // Sync slider state from server-side value profile; user may still override locally.
    if (!isAuthenticated || !valueProfile?.simpleProfile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    setSelectedMaterials([])
    setSelectedColors([])
    setSelectedSizes([])
    setSelectedSellerIds([])
    setCurrentPage(0)
  }

  /** Toggles one value of a multi-select filter axis and returns to page 1. */
  const makeToggle =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) => {
      setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
      setCurrentPage(0)
    }

  const handleToggleMaterial = makeToggle(setSelectedMaterials)
  const handleToggleColor = makeToggle(setSelectedColors)
  const handleToggleSize = makeToggle(setSelectedSizes)
  const handleToggleSeller = makeToggle(setSelectedSellerIds)

  // ── Data via React Query ───────────────────────────────────────────
  const apiSort = sortOptions.find((o) => o.value === sortBy)?.apiSort
  const { data, isLoading, isFetching, error, refetch } = useProducts({
    search: debouncedSearch,
    priceRange,
    materials: selectedMaterials,
    colors: selectedColors,
    sizes: selectedSizes,
    sellerIds: selectedSellerIds,
    apiSort,
    currentPage,
  })
  const products: ProductDetail[] = data?.products ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0

  // Count for the mobile "Filter (N)" trigger (search has its own bar → excluded).
  const activeFilterCount = countActiveFilters({
    selectedMaterials,
    selectedColors,
    selectedSizes,
    selectedSellerIds,
    priceRange,
    sustainabilityImportance,
  })

  // The empty state only offers "Filter zurücksetzen" when there is something
  // to reset — search counts here even though it sits outside the sidebar.
  const hasActiveFilters = activeFilterCount > 0 || debouncedSearch.length > 0

  // ── Handlers ───────────────────────────────────────────────────────
  const handleImportanceChange = (attribute: string, importance: string) => {
    setSustainabilityImportance((prev) => ({ ...prev, [attribute]: importance }))
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(0)
  }

  const scrollToShop = () => {
    shopRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // The sidebar is rendered twice (desktop column + mobile sheet). Sharing one
  // prop object keeps both instances in sync — a new filter can't reach only one.
  const sidebarProps: React.ComponentProps<typeof FilterSidebar> = {
    isAuthenticated,
    hasValueProfile: !!valueProfile?.simpleProfile,
    sustainabilityImportance,
    onImportanceChange: handleImportanceChange,
    priceRange,
    onPriceRangeChange: setPriceRange,
    materials: materials ?? [],
    selectedMaterials,
    onToggleMaterial: handleToggleMaterial,
    colorFacets: productFacets?.colors ?? [],
    selectedColors,
    onToggleColor: handleToggleColor,
    sizeFacets: productFacets?.sizes ?? [],
    selectedSizes,
    onToggleSize: handleToggleSize,
    sellerFacets: sellerFacets ?? [],
    selectedSellerIds,
    onToggleSeller: handleToggleSeller,
    onPageReset: () => setCurrentPage(0),
  }

  return (
    <div>
      <HeroBanner onScrollToShop={scrollToShop} />

      <TrustBar />

      <CategoryChips
        activeSearch={debouncedSearch}
        onSelectCategory={applyCategory}
        onReset={resetFilters}
      />

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <div ref={shopRef} className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Produkte suchen…"
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* Desktop: Sidebar in der linken Spalte; mobil ausgeblendet (→ Sheet). */}
        <div className="hidden md:block">
          <FilterSidebar {...sidebarProps} />
        </div>

        {/* ── Products Section ─────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {isLoading ? (
                <span className="text-muted-foreground">Lädt…</span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{totalElements}</span> Produkte
                  {isFetching && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              {/* Mobiler Filter-Trigger — nur unterhalb md, öffnet das Sheet (#78). */}
              <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm transition-colors hover:bg-secondary md:hidden"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-xs font-semibold text-ink-900">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-4">
                  <SheetHeader className="mb-4 text-left">
                    <SheetTitle>Produkte filtern</SheetTitle>
                  </SheetHeader>
                  <FilterSidebar {...sidebarProps} />
                </SheetContent>
              </Sheet>

              <SortControls sortBy={sortBy} onSortChange={handleSortChange} />
            </div>
          </div>

          {/* Skeleton — shown only on first load */}
          {isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: PRODUCTS_PAGE_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
                >
                  <div className="aspect-square animate-pulse bg-green-50" />
                  <div className="space-y-2.5 p-3 sm:p-4">
                    <div className="h-3 w-1/3 animate-pulse rounded-full bg-green-50" />
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-secondary" />
                    <div className="h-3 w-full animate-pulse rounded-full bg-secondary" />
                    <div className="flex gap-1.5 pt-1">
                      <div className="h-4 w-12 animate-pulse rounded-full bg-green-50" />
                      <div className="h-4 w-14 animate-pulse rounded-full bg-warning-tint" />
                    </div>
                    <div className="mt-1 h-5 w-1/4 animate-pulse rounded-full bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-tint">
                <AlertCircle className="h-8 w-8 text-danger" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Produkte konnten nicht geladen werden</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bitte überprüfe deine Verbindung
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-green-600"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && products.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <PackageSearch className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Keine Produkte gefunden</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Versuche andere Suchbegriffe oder passe die Filter an"
                    : "Aktuell sind keine Produkte verfügbar"}
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm font-medium text-green-600 hover:underline"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && products.length > 0 && (
            <div
              className={`grid grid-cols-2 gap-3 transition-opacity duration-200 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 ${isFetching ? "opacity-60" : "opacity-100"}`}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  productHref={
                    product.slug ? `/product?slug=${product.slug}` : `/product?id=${product.id}`
                  }
                  sellerHref={
                    product.seller?.userId ? `/producer?id=${product.seller.userId}` : null
                  }
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground"
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
                        ? "border-green-600 bg-green-500 text-ink-900"
                        : "border-border bg-white text-foreground hover:bg-secondary"
                    }`}
                  >
                    {page + 1}
                  </button>
                )
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm text-foreground shadow-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground"
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
