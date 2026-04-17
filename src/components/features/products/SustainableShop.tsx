"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Leaf, Loader2, AlertCircle, Search } from "lucide-react"
import type { ProductDetail } from "@/src/types"
import { useProducts, PRODUCTS_PAGE_SIZE } from "@/src/hooks/useProducts"
import { useAuth } from "@/src/context/AuthContext"
import { useBuyerValueProfile } from "@/src/hooks/useBuyerValueProfile"
import {
  sustainabilityFilters,
  profileWeightToSlider,
  MIDDLE_IMPORTANCE,
  sortOptions,
} from "./shop-constants"
import HeroBanner from "./HeroBanner"
import TrustBar from "./TrustBar"
import CategoryChips from "./CategoryChips"
import FilterSidebar from "./FilterSidebar"
import SortControls from "./SortControls"
import ProductCard from "./ProductCard"

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

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(0)
  }

  const handleProductClick = (slug: string | undefined, id: string) => {
    router.push(slug ? `/product?slug=${slug}` : `/product?id=${id}`)
  }

  const handleSellerClick = (e: React.MouseEvent, sellerId: string | undefined) => {
    e.stopPropagation()
    if (sellerId) router.push(`/producer?id=${sellerId}`)
  }

  const scrollToShop = () => {
    shopRef.current?.scrollIntoView({ behavior: "smooth" })
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
        <FilterSidebar
          isAuthenticated={isAuthenticated}
          hasValueProfile={!!valueProfile?.simpleProfile}
          sustainabilityImportance={sustainabilityImportance}
          onImportanceChange={handleImportanceChange}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          onPageReset={() => setCurrentPage(0)}
        />

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

            <SortControls sortBy={sortBy} onSortChange={handleSortChange} />
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
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick}
                  onSellerClick={handleSellerClick}
                />
              ))}
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
