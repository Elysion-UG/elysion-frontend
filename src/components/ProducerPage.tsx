"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  MapPin,
  Award,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Package,
} from "lucide-react"
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
            const detail = await ProductService.getBySlug(page.content[0].id)
            setSeller(detail.seller)
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-slate-400" />
        <p className="text-slate-600">{error}</p>
        <button onClick={() => (window.location.href = "/")} className="text-teal-600 hover:underline">
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
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-teal-600 to-teal-800">
        <div className="absolute inset-0 bg-black/20" />
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 flex items-center gap-2 text-white bg-black/30 hover:bg-black/50 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>
      </div>

      <div className="container mx-auto px-4">
        {/* Header Card */}
        <div className="relative -mt-16 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Logo */}
              <div className="w-24 h-24 md:w-32 md:h-32 bg-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 -mt-16 md:-mt-20 border-4 border-white shadow-lg">
                <span className="text-white font-bold text-4xl md:text-5xl">{displayInitial}</span>
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800">{displayName}</h1>
                    {seller && (
                      <p className="text-slate-500 mt-1">
                        {seller.firstName} {seller.lastName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
                    <Package className="w-5 h-5 text-slate-600" />
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
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex">
              {(["products", "about"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-6 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-teal-600 text-teal-600 bg-teal-50"
                      : "text-slate-700 hover:text-teal-600 hover:bg-slate-50"
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
                  <div className="text-center py-12 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Dieser Verkäufer hat noch keine aktiven Produkte.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => (window.location.href = `/product?id=${product.id}`)}
                        className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-teal-400 transition-all cursor-pointer group"
                      >
                        <div className="aspect-square overflow-hidden bg-slate-100 flex items-center justify-center">
                          <Package className="w-16 h-16 text-slate-300 group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-slate-800 mt-1 line-clamp-2">{product.title}</h3>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-lg font-bold text-slate-800">{formatEuro(product.price)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = `/product?id=${product.id}`
                              }}
                              className="p-2 text-teal-600 hover:bg-teal-100 rounded-full transition-colors"
                            >
                              <ShoppingCart className="w-5 h-5" />
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
                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Verkäufer-Informationen</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Award className="w-5 h-5 text-teal-600" />
                      <span className="font-medium">{displayName}</span>
                    </div>
                    {seller && (
                      <div className="flex items-center gap-3 text-slate-700">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        <span>
                          Ansprechpartner: {seller.firstName} {seller.lastName}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-slate-700">
                      <Package className="w-5 h-5 text-slate-400" />
                      <span>{products.length} aktive Produkte</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-500 text-sm">
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
