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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <AlertCircle className="h-12 w-12 text-slate-400" />
        <p className="text-slate-600">{error ?? "Produkt nicht gefunden."}</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="text-teal-600 hover:underline"
        >
          Zurück zur Startseite
        </button>
      </div>
    )
  }

  const optionTypes = Array.from(
    new Set((product.variants ?? []).flatMap((v) => (v.options ?? []).map((o) => o.type)))
  )
  const optionValues = (type: string) =>
    Array.from(
      new Set(
        (product.variants ?? []).flatMap((v) =>
          (v.options ?? []).filter((o) => o.type === type).map((o) => o.value)
        )
      )
    )

  const findSelectedVariant = (): ProductVariant | undefined => {
    if (optionTypes.length === 0) return undefined
    return (product.variants ?? []).find((v) =>
      optionTypes.every((type) => {
        const sel = selectedOptions[type]
        return !sel || (v.options ?? []).some((o) => o.type === type && o.value === sel)
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

  const images =
    (product.images?.length ?? 0) > 0
      ? (product.images ?? []).map((img) => img.url)
      : ["/placeholder.svg"]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => window.history.back()}
          className="mb-6 flex items-center gap-2 text-slate-700 transition-colors hover:text-teal-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <img
                src={images[selectedImageIndex] || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImageIndex === i ? "border-teal-600" : "border-slate-200"
                    }`}
                  >
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`${product.name} ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                  {product.category?.name}
                </span>
                {product.status !== "ACTIVE" && (
                  <span className="inline-flex items-center rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                    Nicht verfügbar
                  </span>
                )}
              </div>

              <button
                onClick={() =>
                  (window.location.href = `/producer?sellerId=${product.seller?.userId}`)
                }
                className="mb-1 flex items-center gap-1 text-sm font-medium text-teal-600 transition-colors hover:text-teal-700 hover:underline"
              >
                {product.seller?.companyName}
                <ExternalLink className="h-3 w-3" />
              </button>

              <h1 className="mb-2 text-3xl font-bold text-slate-800">{product.name}</h1>
              {product.shortDesc && <p className="text-lg text-slate-600">{product.shortDesc}</p>}
            </div>

            {/* Seller Card */}
            <div
              onClick={() => (window.location.href = `/producer?sellerId=${product.seller?.userId}`)}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-teal-400 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                  <span className="text-lg font-bold text-teal-700">
                    {product.seller?.companyName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{product.seller?.companyName}</h4>
                  <p className="text-sm text-slate-500">
                    {product.seller?.firstName} {product.seller?.lastName}
                  </p>
                </div>
                <ExternalLink className="ml-auto h-4 w-4 text-slate-400" />
              </div>
              {certificates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {certificates.slice(0, 4).map((c) => (
                    <span
                      key={c.id}
                      className="flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-700"
                    >
                      <Award className="h-3 w-3" />
                      {c.title}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-800">{formatEuro(displayPrice ?? 0)}</span>
              {selectedVariant &&
                selectedVariant.price !== null &&
                selectedVariant.price !== product.basePrice && (
                  <span className="text-sm text-slate-500 line-through">
                    {formatEuro(product.basePrice ?? 0)}
                  </span>
                )}
            </div>

            {/* Variant Options */}
            {optionTypes.map((type) => (
              <div key={type}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  {type}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {optionValues(type).map((val) => {
                    const inStock = (product.variants ?? []).some(
                      (v) =>
                        (v.options ?? []).some((o) => o.type === type && o.value === val) &&
                        (v.available ?? false)
                    )
                    return (
                      <button
                        key={val}
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [type]: val }))}
                        disabled={!inStock}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          selectedOptions[type] === val
                            ? "border-teal-600 bg-teal-600 text-white"
                            : inStock
                              ? "border-slate-300 text-slate-700 hover:border-teal-600"
                              : "cursor-not-allowed border-slate-200 text-slate-400 line-through"
                        }`}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
                {selectedVariant && (
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedVariant.available} verfügbar
                  </p>
                )}
              </div>
            ))}

            {/* Quantity */}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
                Menge
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2rem] text-center text-lg font-medium text-slate-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.status !== "ACTIVE"}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isAddingToCart ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
              {product.status === "ACTIVE" ? "In den Warenkorb" : "Nicht verfügbar"}
            </button>

            {/* Shipping info */}
            <div className="space-y-2 rounded-lg bg-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Truck className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Kostenloser Versand ab €50</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Shield className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">30 Tage Rückgaberecht</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Recycle className="h-5 w-5 flex-shrink-0" />
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
                  className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-slate-700 hover:border-slate-300 hover:text-teal-600"
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
                <p className="whitespace-pre-line leading-relaxed text-slate-700">
                  {product.description}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Kategorie</p>
                    <p className="font-medium text-slate-800">{product.category?.name}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Verkäufer</p>
                    <p className="font-medium text-slate-800">{product.seller?.companyName}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">MwSt.</p>
                    <p className="font-medium text-slate-800">{bpsToPercent(product.taxRate ?? 0)}%</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "certificates" && (
              <div>
                {certificates.length === 0 ? (
                  <p className="text-slate-500">Keine Zertifikate für dieses Produkt.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="rounded-lg border border-slate-200 bg-white p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                            <Award className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{cert.title}</h4>
                            <p className="mt-0.5 text-sm text-slate-500">{cert.issuerName}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  cert.status === "VERIFIED"
                                    ? "bg-green-100 text-green-700"
                                    : cert.status === "PENDING"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {cert.status === "VERIFIED"
                                  ? "Verifiziert"
                                  : cert.status === "PENDING"
                                    ? "In Prüfung"
                                    : cert.status}
                              </span>
                              <span className="text-xs text-slate-400">{cert.certificateType}</span>
                            </div>
                            {cert.expiryDate && (
                              <p className="mt-1 text-xs text-slate-400">
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
