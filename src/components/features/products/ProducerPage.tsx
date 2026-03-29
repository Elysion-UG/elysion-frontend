"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, MapPin, Award, ShoppingCart, Loader2, AlertCircle, Package } from "lucide-react"
import { ProductService } from "@/src/services/product.service"
import type { ProductListItem, ProductSeller } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"

export default function ProducerPage() {
  const [sellerId, setSellerId] = useState<string | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setSellerId(p.get("sellerId"))
  }, [])

  const [products, setProducts] = useState<ProductListItem[]>([])
  const [seller, setSeller] = useState<ProductSeller | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"products" | "about">("products")

  useEffect(() => {
    if (!sellerId) {
      setError("Kein Verkäufer angegeben.")
      setIsLoading(false)
      return
    }
    const fetch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const page = await ProductService.list({ sellerId, size: 50 })
        setProducts(page.content)
        // Get seller info from the first product's extended data if possible
        // The list API returns ProductListItem which has sellerId but not seller details.
        // Try fetching one product's detail to get seller info.
        if (page.content.length > 0) {
          try {
            const firstSlug = page.content[0].slug
            const detail = firstSlug ? await ProductService.getBySlug(firstSlug) : null
            if (detail) setSeller(detail.seller ?? null)
          } catch {
            // fallback: no seller detail available
          }
        }
      } catch {
        setError("Verkäufer oder Produkte konnten nicht geladen werden.")
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [sellerId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <AlertCircle className="h-12 w-12 text-slate-400" />
        <p className="text-slate-600">{error}</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="text-teal-600 hover:underline"
        >
          Zurück zur Startseite
        </button>
      </div>
    )
  }

  const displayName = seller?.companyName ?? "Unbekannter Verkäufer"
  const displayInitial = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-48 bg-gradient-to-br from-teal-600 to-teal-800 md:h-64">
        <div className="absolute inset-0 bg-black/20" />
        <button
          onClick={() => window.history.back()}
          className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-white transition-colors hover:bg-black/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>
      </div>

      <div className="container mx-auto px-4">
        {/* Header Card */}
        <div className="relative -mt-16 mb-8">
          <div className="rounded-xl bg-white p-6 shadow-lg md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Logo */}
              <div className="-mt-16 flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border-4 border-white bg-teal-600 shadow-lg md:-mt-20 md:h-32 md:w-32">
                <span className="text-4xl font-bold text-white md:text-5xl">{displayInitial}</span>
              </div>

              <div className="flex-1">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800">{displayName}</h1>
                    {seller && (
                      <p className="mt-1 text-slate-500">
                        {seller.firstName} {seller.lastName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2">
                    <Package className="h-5 w-5 text-slate-600" />
                    <div>
                      <span className="text-xl font-bold text-slate-700">{products.length}</span>
                      <p className="text-xs text-slate-500">Produkte</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 rounded-xl bg-white shadow-sm">
          <div className="border-b border-slate-200">
            <nav className="flex">
              {(["products", "about"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-teal-600 bg-teal-50 text-teal-600"
                      : "text-slate-700 hover:bg-slate-50 hover:text-teal-600"
                  }`}
                >
                  {tab === "products" ? `Produkte (${products.length})` : "Über den Verkäufer"}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === "products" && (
              <div>
                {products.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Package className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                    <p>Dieser Verkäufer hat noch keine aktiven Produkte.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() =>
                          (window.location.href = product.slug
                            ? `/product?slug=${product.slug}`
                            : `/product?id=${product.id}`)
                        }
                        className="group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:border-teal-400 hover:shadow-lg"
                      >
                        <div className="flex aspect-square items-center justify-center overflow-hidden bg-slate-100">
                          <Package className="h-16 w-16 text-slate-300 transition-transform group-hover:scale-105" />
                        </div>
                        <div className="p-4">
                          <h3 className="mt-1 line-clamp-2 font-semibold text-slate-800">
                            {product.title}
                          </h3>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-lg font-bold text-slate-800">
                              {formatEuro(product.price ?? 0)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = product.slug
                                  ? `/product?slug=${product.slug}`
                                  : `/product?id=${product.id}`
                              }}
                              className="rounded-full p-2 text-teal-600 transition-colors hover:bg-teal-100"
                            >
                              <ShoppingCart className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-6">
                <div className="rounded-lg bg-slate-50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-800">
                    Verkäufer-Informationen
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Award className="h-5 w-5 text-teal-600" />
                      <span className="font-medium">{displayName}</span>
                    </div>
                    {seller && (
                      <div className="flex items-center gap-3 text-slate-700">
                        <MapPin className="h-5 w-5 text-slate-400" />
                        <span>
                          Ansprechpartner: {seller.firstName} {seller.lastName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-slate-700">
                      <Package className="h-5 w-5 text-slate-400" />
                      <span>{products.length} aktive Produkte</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  Weitere Informationen über diesen Verkäufer werden in Kürze verfügbar sein.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
