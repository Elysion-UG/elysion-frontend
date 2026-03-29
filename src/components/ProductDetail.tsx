"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  ShoppingCart,
  Truck,
  Shield,
  Recycle,
  ArrowLeft,
  Plus,
  Minus,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { ProductService } from "@/src/services/product.service"
import { CertificateService } from "@/src/services/certificate.service"
import { useCart } from "@/src/hooks/useCart"
import { formatEuro } from "@/src/lib/currency"
import type {
  ProductDetail as ProductDetailType,
  PublicCertificate,
  ProductVariant,
} from "@/src/types"
import { toast } from "sonner"

export default function ProductDetail() {
  const searchParams = useSearchParams()
  const slug = searchParams.get("slug")
  const { addItem } = useCart()

  const [product, setProduct] = useState<ProductDetailType | null>(null)
  const [certificates, setCertificates] = useState<PublicCertificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("details")
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    if (!slug) {
      setError("Kein Produkt ausgewählt.")
      setIsLoading(false)
      return
    }

    const fetchProduct = async () => {
      try {
        const data = await ProductService.getBySlug(slug)
        setProduct(data)
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0])
        }
        // Load certificates in background
        CertificateService.getProductCertificates(data.id)
          .then(setCertificates)
          .catch(() => {})
      } catch {
        setError("Produkt konnte nicht geladen werden.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  const handleAddToCart = async () => {
    if (!product) return
    setAddingToCart(true)
    try {
      const priceEuro = selectedVariant?.price ?? product.basePrice ?? product.price
      await addItem({
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity,
        productName: product.name ?? product.title,
        // product.slug may not be returned by the backend — fall back to the
        // URL slug which is always available and definitively correct.
        productSlug: product.slug ?? slug ?? undefined,
        imageUrl:
          product.images?.[0]?.url ?? product.imageUrls?.[0] ?? selectedVariant?.imageUrls?.[0],
        unitPriceCents: priceEuro != null ? Math.round(priceEuro * 100) : undefined,
      })
      toast.success("Zum Warenkorb hinzugefügt")
    } catch {
      toast.error("Fehler beim Hinzufügen zum Warenkorb")
    } finally {
      setAddingToCart(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-slate-600">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p>{error ?? "Produkt nicht gefunden."}</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
        >
          Zurück zum Shop
        </button>
      </div>
    )
  }

  const images =
    product.images?.map((img) => img.url) ?? product.imageUrls ?? selectedVariant?.imageUrls ?? []
  const displayImages = images.length > 0 ? images : ["/placeholder.svg"]

  const price = selectedVariant?.price ?? product.basePrice ?? product.price ?? 0
  const sellerName =
    product.seller?.companyName ??
    (product.seller?.firstName && product.seller?.lastName
      ? `${product.seller.firstName} ${product.seller.lastName}`
      : null)

  // Extract unique option types and their values from variants
  const optionTypes: Record<string, string[]> = {}
  product.variants?.forEach((v) => {
    v.options?.forEach((opt) => {
      if (!optionTypes[opt.type]) optionTypes[opt.type] = []
      if (!optionTypes[opt.type].includes(opt.value)) {
        optionTypes[opt.type].push(opt.value)
      }
    })
    // Also handle size/color directly on variant
    if (v.size && !optionTypes["Größe"]?.includes(v.size)) {
      optionTypes["Größe"] = [...(optionTypes["Größe"] ?? []), v.size]
    }
    if (v.color && !optionTypes["Farbe"]?.includes(v.color)) {
      optionTypes["Farbe"] = [...(optionTypes["Farbe"] ?? []), v.color]
    }
  })

  const selectedOptionValues: Record<string, string> = {}
  selectedVariant?.options?.forEach((opt) => {
    selectedOptionValues[opt.type] = opt.value
  })
  if (selectedVariant?.size) selectedOptionValues["Größe"] = selectedVariant.size
  if (selectedVariant?.color) selectedOptionValues["Farbe"] = selectedVariant.color

  const handleOptionSelect = (type: string, value: string) => {
    const match = product.variants?.find((v) => {
      const byOption = v.options?.some((o) => o.type === type && o.value === value)
      const bySize = type === "Größe" && v.size === value
      const byColor = type === "Farbe" && v.color === value
      return byOption || bySize || byColor
    })
    if (match) setSelectedVariant(match)
  }

  const inStock = selectedVariant ? (selectedVariant.stock ?? 0) > 0 : true

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => (window.location.href = "/")}
          className="mb-6 flex items-center gap-2 text-slate-700 transition-colors hover:text-teal-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Produkten
        </button>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <img
                src={displayImages[selectedImageIndex] ?? "/placeholder.svg"}
                alt={product.name ?? product.title}
                className="h-full w-full object-cover"
              />
            </div>
            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImageIndex === index ? "border-teal-600" : "border-slate-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.category && (
                <span className="mb-2 inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                  {product.category.name}
                </span>
              )}

              {sellerName && (
                <button
                  onClick={() =>
                    product.seller?.userId &&
                    (window.location.href = `/producer?id=${product.seller.userId}`)
                  }
                  className="mb-1 flex items-center gap-1 text-sm font-medium text-teal-600 transition-colors hover:text-teal-700 hover:underline"
                >
                  {sellerName}
                </button>
              )}

              <h1 className="mb-2 text-3xl font-bold text-slate-800">
                {product.name ?? product.title}
              </h1>
              {product.shortDesc && <p className="text-lg text-slate-600">{product.shortDesc}</p>}
            </div>

            {/* Seller card */}
            {sellerName && (
              <div
                onClick={() =>
                  product.seller?.userId &&
                  (window.location.href = `/producer?id=${product.seller.userId}`)
                }
                className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-teal-400 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                    <span className="text-lg font-bold text-teal-700">{sellerName.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{sellerName}</h4>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="h-3 w-3" />
                      Verifizierter Verkäufer
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-800">{formatEuro(price)}</span>
              {!inStock && (
                <span className="rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                  Nicht verfügbar
                </span>
              )}
            </div>

            {/* Variant selectors */}
            {Object.entries(optionTypes).map(([type, values]) => (
              <div key={type}>
                <h3 className="mb-3 text-lg font-semibold text-slate-800">{type}</h3>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => (
                    <button
                      key={value}
                      onClick={() => handleOptionSelect(type, value)}
                      className={`rounded-lg border px-4 py-2 font-medium transition-colors ${
                        selectedOptionValues[type] === value
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 text-slate-700 hover:border-teal-600"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div>
              <h3 className="mb-3 text-lg font-semibold text-slate-800">Menge</h3>
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

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock || addingToCart}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {addingToCart ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
              {inStock ? "In den Warenkorb" : "Nicht verfügbar"}
            </button>

            {/* Shipping info */}
            <div className="space-y-2 rounded-lg bg-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Truck className="h-5 w-5" />
                <span className="font-medium">Kostenloser Versand ab €50</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Shield className="h-5 w-5" />
                <span className="font-medium">30 Tage Rückgaberecht</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Recycle className="h-5 w-5" />
                <span className="font-medium">CO2-neutraler Versand</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8">
              {["details", "sustainability"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-slate-700 hover:border-slate-300 hover:text-teal-600"
                  }`}
                >
                  {tab === "details" ? "Details" : "Nachhaltigkeit"}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === "details" && (
              <div className="prose max-w-none">
                <p className="leading-relaxed text-slate-700">
                  {product.description ?? "Keine Beschreibung vorhanden."}
                </p>
                {selectedVariant && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    {selectedVariant.sku && (
                      <div>
                        <span className="font-medium text-slate-700">SKU:</span>{" "}
                        <span className="text-slate-600">{selectedVariant.sku}</span>
                      </div>
                    )}
                    {selectedVariant.material && (
                      <div>
                        <span className="font-medium text-slate-700">Material:</span>{" "}
                        <span className="text-slate-600">{selectedVariant.material}</span>
                      </div>
                    )}
                    {selectedVariant.stock !== undefined && (
                      <div>
                        <span className="font-medium text-slate-700">Lagerbestand:</span>{" "}
                        <span className="text-slate-600">{selectedVariant.stock} Stück</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "sustainability" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-800">Zertifizierungen</h3>
                {certificates.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="rounded-lg bg-slate-100 p-4">
                        <h4 className="font-semibold text-slate-800">
                          {cert.title ?? cert.name ?? cert.certificateType}
                        </h4>
                        {cert.issuerName && (
                          <p className="mt-1 text-sm text-slate-600">
                            Aussteller: {cert.issuerName}
                          </p>
                        )}
                        {cert.validUntil && (
                          <p className="mt-1 text-sm text-slate-600">
                            Gültig bis: {new Date(cert.validUntil).toLocaleDateString("de-DE")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">Keine Zertifizierungen hinterlegt.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
