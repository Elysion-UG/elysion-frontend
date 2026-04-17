"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
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
  Check,
} from "lucide-react"
import { ProductService } from "@/src/services/product.service"
import { CertificateService } from "@/src/services/certificate.service"
import { useCart } from "@/src/context/CartContext"
import { formatEuro } from "@/src/lib/currency"
import type {
  ProductDetail as ProductDetailType,
  PublicCertificate,
  ProductVariant,
} from "@/src/types"
import { toast } from "sonner"

export default function ProductDetail() {
  const router = useRouter()
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
  const [justAdded, setJustAdded] = useState(false)
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
          .catch(() => {
            toast.error("Zertifikate konnten nicht geladen werden.")
          })
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
        productName: product.name,
        // product.slug may not be returned by the backend — fall back to the
        // URL slug which is always available and definitively correct.
        productSlug: product.slug ?? slug ?? undefined,
        imageUrl:
          product.images?.[0]?.url ?? product.imageUrls?.[0] ?? selectedVariant?.imageUrls?.[0],
        unitPriceCents: priceEuro != null ? Math.round(priceEuro * 100) : undefined,
        variantOptions: selectedVariant?.options?.map((o) => ({ name: o.type, value: o.value })),
      })
      toast.success("Zum Warenkorb hinzugefügt")
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1500)
    } catch {
      toast.error("Fehler beim Hinzufügen zum Warenkorb")
    } finally {
      setAddingToCart(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-sage-500" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="font-medium text-stone-700">{error ?? "Produkt nicht gefunden."}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-xl bg-sage-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sage-700"
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

  // stock == null means the API returned no stock info → treat as available.
  // Only mark unavailable when stock is explicitly 0.
  const inStock = selectedVariant
    ? selectedVariant.stock == null || selectedVariant.stock > 0
    : true

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-400 transition-colors hover:text-sage-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Produkten
      </button>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-stone-200 bg-sage-50 shadow-sm">
            <Image
              src={displayImages[selectedImageIndex] ?? "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          {displayImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                    selectedImageIndex === index
                      ? "border-sage-500 shadow-sm"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {product.category && (
                <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                  {product.category.name}
                </span>
              )}
            </div>

            {sellerName && (
              <button
                onClick={() =>
                  product.seller?.userId && router.push(`/producer?id=${product.seller.userId}`)
                }
                className="mb-2 text-xs font-semibold uppercase tracking-wider text-sage-600 transition-colors hover:text-sage-700 hover:underline"
              >
                {sellerName}
              </button>
            )}

            <h1 className="mb-2 text-2xl font-bold text-stone-900 sm:text-3xl">{product.name}</h1>
            {product.shortDesc && (
              <p className="text-base leading-relaxed text-stone-500">{product.shortDesc}</p>
            )}
          </div>

          {/* Seller card */}
          {sellerName && (
            <div
              onClick={() =>
                product.seller?.userId && router.push(`/producer?id=${product.seller.userId}`)
              }
              className="cursor-pointer rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:border-sage-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100">
                  <span className="text-sm font-bold text-sage-700">{sellerName.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-stone-800">{sellerName}</h4>
                  <div className="flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="h-3 w-3 text-sage-500" />
                    Verifizierter Verkäufer
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-stone-900">{formatEuro(price)}</span>
              {inStock ? (
                <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700">
                  Auf Lager
                </span>
              ) : (
                <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  Nicht verfügbar
                </span>
              )}
            </div>
            {/* § 1 PAngV: MwSt.-Hinweis */}
            <p className="mt-1 text-xs text-stone-400">
              inkl. MwSt.,{" "}
              <a href="/versand" className="underline hover:text-stone-600">
                zzgl. Versandkosten
              </a>
            </p>
          </div>

          {/* Variant selectors */}
          {Object.entries(optionTypes).map(([type, values]) => (
            <div key={type}>
              <h3 className="mb-3 text-lg font-semibold text-stone-800">{type}</h3>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleOptionSelect(type, value)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedOptionValues[type] === value
                        ? "border-sage-600 bg-sage-600 text-white shadow-sm"
                        : "border-stone-200 text-stone-700 hover:border-sage-400 hover:bg-sage-50"
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
            <h3 className="mb-3 text-sm font-semibold text-stone-700">Menge</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Menge verringern"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span
                aria-live="polite"
                aria-label={`Menge: ${quantity}`}
                className="min-w-[2rem] text-center text-base font-bold text-stone-800"
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Menge erhöhen"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-sage-300 hover:bg-sage-50 hover:text-sage-700"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock || addingToCart}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-300 ${
              justAdded ? "bg-green-600 hover:bg-green-700" : "bg-sage-600 hover:bg-sage-700"
            }`}
          >
            {addingToCart ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : justAdded ? (
              <Check className="h-5 w-5 animate-scale-in" />
            ) : (
              <ShoppingCart className="h-5 w-5" />
            )}
            {addingToCart
              ? "Wird hinzugefügt…"
              : justAdded
                ? "Hinzugefügt!"
                : inStock
                  ? "In den Warenkorb"
                  : "Nicht verfügbar"}
          </button>

          {/* Shipping info */}
          <div className="space-y-2.5 rounded-xl border border-sage-100 bg-sage-50 p-4">
            <div className="flex items-center gap-2 text-sm text-sage-700">
              <Truck className="h-4 w-4 text-sage-500" />
              <span>Kostenloser Versand ab €50</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-sage-700">
              <Shield className="h-4 w-4 text-sage-500" />
              <span>
                14 Tage gesetzliches Widerrufsrecht (
                <a href="/widerruf" className="underline hover:text-sage-900">
                  Details
                </a>
                )
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-sage-700">
              <Recycle className="h-4 w-4 text-sage-500" />
              <span>Klimafreundlicher Versand (vom Verkäufer zertifiziert)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="border-b border-stone-200">
          <nav className="flex gap-1">
            {[
              { id: "details", label: "Details" },
              { id: "sustainability", label: "Nachhaltigkeit" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-sage-600 text-sage-700"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {activeTab === "details" && (
            <div className="space-y-6">
              <p className="leading-relaxed text-stone-600">
                {product.description ?? "Keine Beschreibung vorhanden."}
              </p>
              {selectedVariant && (
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  {selectedVariant.sku && (
                    <div className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2">
                      <p className="text-xs text-stone-400">SKU</p>
                      <p className="font-medium text-stone-700">{selectedVariant.sku}</p>
                    </div>
                  )}
                  {selectedVariant.material && (
                    <div className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2">
                      <p className="text-xs text-stone-400">Material</p>
                      <p className="font-medium text-stone-700">{selectedVariant.material}</p>
                    </div>
                  )}
                  {selectedVariant.stock !== undefined && (
                    <div className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2">
                      <p className="text-xs text-stone-400">Lagerbestand</p>
                      <p className="font-medium text-stone-700">{selectedVariant.stock} Stück</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "sustainability" && (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-stone-800">Zertifizierungen</h3>
              {certificates.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="rounded-xl border border-sage-100 bg-sage-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100">
                          <Shield className="h-4 w-4 text-sage-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-stone-800">
                            {cert.title ?? cert.certificateType}
                          </h4>
                          {cert.issuerName && (
                            <p className="mt-0.5 text-xs text-stone-500">
                              Aussteller: {cert.issuerName}
                            </p>
                          )}
                          {cert.validUntil && (
                            <p className="mt-0.5 text-xs text-stone-400">
                              Gültig bis: {new Date(cert.validUntil).toLocaleDateString("de-DE")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-400">Keine Zertifizierungen hinterlegt.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
