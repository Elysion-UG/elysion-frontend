"use client"

import { AlertCircle, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useCart } from "@/src/context/CartContext"
import { ProductDetailView, useProductDetail } from "./product-detail"

export default function ProductDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = searchParams.get("slug")
  const { addItem } = useCart()

  const { product, certificates, isLoading, error, selectedVariant, setSelectedVariant } =
    useProductDetail(slug)

  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const handleAddToCart = async () => {
    if (!product) return
    setIsAdding(true)
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
      setIsAdding(false)
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
  const price = selectedVariant?.price ?? product.basePrice ?? product.price ?? 0
  const sellerName =
    product.seller?.companyName ??
    (product.seller?.firstName && product.seller?.lastName
      ? `${product.seller.firstName} ${product.seller.lastName}`
      : null)

  // stock == null means the API returned no stock info → treat as available.
  // Only mark unavailable when stock is explicitly 0.
  const inStock = selectedVariant
    ? selectedVariant.stock == null || selectedVariant.stock > 0
    : true

  return (
    <ProductDetailView
      product={product}
      certificates={certificates}
      selectedVariant={selectedVariant}
      onSelectVariant={setSelectedVariant}
      quantity={quantity}
      onQuantityChange={setQuantity}
      onAddToCart={handleAddToCart}
      isAdding={isAdding}
      justAdded={justAdded}
      inStock={inStock}
      images={images}
      price={price}
      sellerName={sellerName}
    />
  )
}
