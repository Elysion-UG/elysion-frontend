"use client"

import { useState, useEffect } from "react"
import {
  ShoppingCart,
  Truck,
  Shield,
  Recycle,
  ArrowLeft,
  Plus,
  Minus,
  Award,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { ProductService } from "@/src/services/product.service"
import { useCart } from "@/src/context/CartContext"
import type { ProductDetail as ProductDetailType, ProductVariant, Certificate } from "@/src/types"
import { formatEuro, bpsToPercent } from "@/src/lib/currency"
import { toast } from "sonner"

export default function ProductDetail() {
  const [slug, setSlug] = useState<string | null>(null)
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setSlug(p.get("slug"))
    setId(p.get("id"))
  }, [])

  const { addItem } = useCart()

  const [product, setProduct] = useState<ProductDetailType | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    const identifier = slug || id
    if (!identifier) {
      setError("Kein Produkt angegeben.")
      setIsLoading(false)
      return
    }
    const fetch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const p = await ProductService.getBySlug(identifier)
        setProduct(p)
        try {
          const certs = await ProductService.getProductCertificates(p.id)
          setCertificates(certs as Certificate[])
        } catch {
          // certificates are non-critical
        }
      } catch {
        setError("Produkt konnte nicht geladen werden.")
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [slug, id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-slate-400" />
        <p className="text-slate-600">{error ?? "Produkt nicht gefunden."}</p>
        <button onClick={() => (window.location.href = "/")} className="text-teal-600 hover:underline">
          Zurück zur Startseite
        </button>
      </div>
    )
  }

  const optionTypes = Array.from(
    new Set(product.variants.flatMap((v) => v.options.map((o) => o.type)))
  )
  const optionValues = (type: string) =>
    Array.from(new Set(product.variants.flatMap((v) => v.options.filter((o) => o.type === type).map((o) => o.value))))

  const findSelectedVariant = (): ProductVariant | undefined => {
    if (optionTypes.length === 0) return undefined
    return product.variants.find((v) =>
      optionTypes.every((type) => {
        const sel = selectedOptions[type]
        return !sel || v.options.some((o) => o.type === type && o.value === sel)
      })
    )
  }

  const selectedVariant = findSelectedVariant()
  const displayPrice = selectedVariant?.price ?? product.basePrice

  const handleAddToCart = async () => {
    if (optionTypes.length > 0 && !selectedVariant) {
      toast.error("Bitte wähle alle Optionen (Größe, Farbe, etc.) aus.")
      return
    }
    setIsAddingToCart(true)
    try {
      await addItem({
        productId: product.id,
        ...(selectedVariant ? { variantId: selectedVariant.id } : {}),
        quantity,
      })
      toast.success("Zum Warenkorb hinzugefügt!")
    } catch {
      toast.error("Fehler beim Hinzufügen zum Warenkorb.")
    } finally {
      setIsAddingToCart(false)
    }
  }

  const images = product.images.length > 0
    ? product.images.map((img) => img.url)
    : ["/placeholder.svg"]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-slate-700 hover:text-teal-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200">
              <img
                src={images[selectedImageIndex] || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === i ? "border-teal-600" : "border-slate-200"
                    }`}
                  >
                    <img src={url || "/placeholder.svg"} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800 border-slate-300">
                  {product.category.name}
                </span>
                {product.status !== "ACTIVE" && (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 border-red-300">
                    Nicht verfügbar
                  </span>
                )}
              </div>

              <button
                onClick={() => (window.location.href = `/producer?sellerId=${product.seller.userId}`)}
                className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors flex items-center gap-1 mb-1"
              >
                {product.seller.companyName}
                <ExternalLink className="w-3 h-3" />
              </button>

              <h1 className="text-3xl font-bold text-slate-800 mb-2">{product.name}</h1>
              {product.shortDesc && <p className="text-slate-600 text-lg">{product.shortDesc}</p>}
            </div>

            {/* Seller Card */}
            <div
              onClick={() => (window.location.href = `/producer?sellerId=${product.seller.userId}`)}
              className="bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-700 font-bold text-lg">
                    {product.seller.companyName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{product.seller.companyName}</h4>
                  <p className="text-sm text-slate-500">
                    {product.seller.firstName} {product.seller.lastName}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
              </div>
              {certificates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {certificates.slice(0, 4).map((c) => (
                    <span key={c.id} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {c.title}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-800">{formatEuro(displayPrice)}</span>
              {selectedVariant && selectedVariant.price !== null && selectedVariant.price !== product.basePrice && (
                <span className="text-sm text-slate-500 line-through">{formatEuro(product.basePrice)}</span>
              )}
            </div>

            {/* Variant Options */}
            {optionTypes.map((type) => (
              <div key={type}>
                <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">{type}</h3>
                <div className="flex flex-wrap gap-2">
                  {optionValues(type).map((val) => {
                    const inStock = product.variants.some(
                      (v) =>
                        v.options.some((o) => o.type === type && o.value === val) &&
                        v.available > 0
                    )
                    return (
                      <button
                        key={val}
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [type]: val }))}
                        disabled={!inStock}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          selectedOptions[type] === val
                            ? "border-teal-600 bg-teal-600 text-white"
                            : inStock
                              ? "border-slate-300 text-slate-700 hover:border-teal-600"
                              : "border-slate-200 text-slate-400 cursor-not-allowed line-through"
                        }`}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
                {selectedVariant && (
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedVariant.available} verfügbar
                  </p>
                )}
              </div>
            ))}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Menge</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-medium text-slate-800 min-w-[2rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.status !== "ACTIVE"}
              className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isAddingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
              {product.status === "ACTIVE" ? "In den Warenkorb" : "Nicht verfügbar"}
            </button>

            {/* Shipping info */}
            <div className="bg-slate-100 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Truck className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Kostenloser Versand ab €50</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Shield className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">30 Tage Rückgaberecht</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Recycle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">CO2-neutraler Versand</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8">
              {(["details", "certificates"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-slate-700 hover:text-teal-600 hover:border-slate-300"
                  }`}
                >
                  {tab === "details" ? "Details" : `Zertifikate (${certificates.length})`}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === "details" && (
              <div className="prose max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{product.description}</p>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Kategorie</p>
                    <p className="font-medium text-slate-800">{product.category.name}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Verkäufer</p>
                    <p className="font-medium text-slate-800">{product.seller.companyName}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">MwSt.</p>
                    <p className="font-medium text-slate-800">{bpsToPercent(product.taxRate)}%</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "certificates" && (
              <div>
                {certificates.length === 0 ? (
                  <p className="text-slate-500">Keine Zertifikate für dieses Produkt.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="bg-white rounded-lg p-5 border border-slate-200">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{cert.title}</h4>
                            <p className="text-sm text-slate-500 mt-0.5">{cert.issuerName}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                cert.status === "VERIFIED"
                                  ? "bg-green-100 text-green-700"
                                  : cert.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}>
                                {cert.status === "VERIFIED" ? "Verifiziert" : cert.status === "PENDING" ? "In Prüfung" : cert.status}
                              </span>
                              <span className="text-xs text-slate-400">{cert.certificateType}</span>
                            </div>
                            {cert.expiryDate && (
                              <p className="text-xs text-slate-400 mt-1">
                                Gültig bis: {new Date(cert.expiryDate).toLocaleDateString("de-DE")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
