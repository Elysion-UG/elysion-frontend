"use client"

import type React from "react"
import { ShieldCheck } from "lucide-react"
import { formatEuro } from "@/src/lib/currency"
import type { ProductDetail } from "@/src/types"
import { certLabel, certStyle } from "./shop-constants"

interface ProductCardProps {
  product: ProductDetail
  onProductClick: (slug: string | undefined, id: string) => void
  onSellerClick: (e: React.MouseEvent, sellerId: string | undefined) => void
}

function getProductImage(product: ProductDetail): string {
  return product.images?.[0]?.url ?? product.imageUrls?.[0] ?? "/placeholder.svg"
}

function getProductPrice(product: ProductDetail): number {
  return product.basePrice ?? product.price ?? 0
}

function getSellerName(product: ProductDetail): string | null {
  if (!product.seller) return null
  return (
    product.seller.companyName ??
    (product.seller.firstName && product.seller.lastName
      ? `${product.seller.firstName} ${product.seller.lastName}`
      : null)
  )
}

export default function ProductCard({ product, onProductClick, onSellerClick }: ProductCardProps) {
  const sellerName = getSellerName(product)
  const image = getProductImage(product)
  const price = getProductPrice(product)
  const certs = product.certificates ?? []

  return (
    <div
      onClick={() => onProductClick(product.slug, product.id)}
      className="group cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sage-200 hover:shadow-lg"
    >
      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-sage-50">
        <img
          src={image}
          alt={product.name ?? product.title ?? "Produkt"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Certificate count badge */}
        {certs.length > 0 && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-sage-700 shadow-sm backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" />
            {certs.length}
          </div>
        )}

        {/* Category badge */}
        {product.category?.name && (
          <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-stone-600 shadow-sm backdrop-blur-sm">
            {product.category.name}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="space-y-1.5 p-4">
        {sellerName && (
          <button
            onClick={(e) => onSellerClick(e, product.seller?.userId)}
            className="text-xs font-semibold uppercase tracking-wider text-sage-600 hover:text-sage-700 hover:underline"
          >
            {sellerName}
          </button>
        )}
        <h3 className="line-clamp-1 text-sm font-semibold text-stone-800">
          {product.name ?? product.title}
        </h3>
        {product.shortDesc && (
          <p className="line-clamp-2 text-xs leading-relaxed text-stone-400">{product.shortDesc}</p>
        )}

        {/* Certificate chips */}
        {certs.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {certs.slice(0, 2).map((cert) => (
              <span
                key={cert.id}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${certStyle(cert.certificateType)}`}
              >
                {certLabel(cert.certificateType)}
              </span>
            ))}
            {certs.length > 2 && (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                +{certs.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-base font-bold text-stone-900">{formatEuro(price)}</span>
          <span className="text-[10px] font-medium text-sage-600">Auf Lager</span>
        </div>
      </div>
    </div>
  )
}
