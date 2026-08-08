"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ProductDetail, ProductVariant, PublicCertificate } from "@/src/types"
import { producerHref } from "@/src/lib/seller-url"
import { AddToCartButton } from "./AddToCartButton"
import { PriceWithStock } from "./PriceWithStock"
import { ProductGallery } from "./ProductGallery"
import { ProductTabs } from "./ProductTabs"
import { QuantityStepper } from "./QuantityStepper"
import { SellerCard } from "./SellerCard"
import { ShippingInfo } from "./ShippingInfo"
import { VariantSelector } from "./VariantSelector"

export interface ProductDetailViewProps {
  product: ProductDetail
  certificates: PublicCertificate[]
  selectedVariant: ProductVariant | null
  onSelectVariant: (variant: ProductVariant) => void
  quantity: number
  onQuantityChange: (quantity: number) => void
  onAddToCart: () => void
  isAdding: boolean
  justAdded: boolean
  inStock: boolean
  images: string[]
  price: number
  sellerName: string | null
}

export function ProductDetailView({
  product,
  certificates,
  selectedVariant,
  onSelectVariant,
  quantity,
  onQuantityChange,
  onAddToCart,
  isAdding,
  justAdded,
  inStock,
  images,
  price,
  sellerName,
}: ProductDetailViewProps) {
  const router = useRouter()

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-green-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Produkten
      </button>

      <div className="grid gap-12 lg:grid-cols-2">
        <ProductGallery images={images} alt={product.name} />

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {product.category && (
                <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {product.category.name}
                </span>
              )}
            </div>

            {sellerName && (
              <button
                onClick={() => {
                  const href = producerHref(product.seller)
                  if (href) router.push(href)
                }}
                className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600 transition-colors hover:text-green-600 hover:underline"
              >
                {sellerName}
              </button>
            )}

            <h1 className="mb-2 text-2xl font-normal text-foreground sm:text-3xl">
              {product.name}
            </h1>
            {product.shortDesc && (
              <p className="text-base leading-relaxed text-muted-foreground">{product.shortDesc}</p>
            )}
          </div>

          {sellerName && (
            <SellerCard
              sellerName={sellerName}
              sellerUserId={product.seller?.userId}
              sellerSlug={product.seller?.slug}
            />
          )}

          <PriceWithStock price={price} inStock={inStock} />

          <VariantSelector
            variants={product.variants}
            selectedVariant={selectedVariant}
            onSelect={onSelectVariant}
          />

          <QuantityStepper quantity={quantity} onChange={onQuantityChange} />

          <AddToCartButton
            inStock={inStock}
            isAdding={isAdding}
            justAdded={justAdded}
            onClick={onAddToCart}
          />

          <ShippingInfo />
        </div>
      </div>

      <ProductTabs
        product={product}
        selectedVariant={selectedVariant}
        certificates={certificates}
      />
    </div>
  )
}
