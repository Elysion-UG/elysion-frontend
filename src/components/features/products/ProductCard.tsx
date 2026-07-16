"use client"

import Link from "next/link"
import Image from "next/image"
import { ShieldCheck } from "lucide-react"
import { formatEuro } from "@/src/lib/currency"
import type { ProductDetail } from "@/src/types"
import { certLabel, certStyle } from "./shop-constants"

interface ProductCardProps {
  product: ProductDetail
  /** Target of the whole-card link, e.g. `/product?slug=…` (fallback `?id=…`). */
  productHref: string
  /** Target of the seller link; pass null/undefined to render the seller name
   *  as plain text (e.g. on the seller's own page). */
  sellerHref?: string | null
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

export default function ProductCard({ product, productHref, sellerHref }: ProductCardProps) {
  const sellerName = getSellerName(product)
  const image = getProductImage(product)
  const price = getProductPrice(product)
  const certs = product.certificates ?? []
  // Only mark as sold out when the API explicitly reports it; unknown stays available.
  const soldOut = product.inStock === false
  const title = product.name ?? product.title ?? "Produkt"

  return (
    <article
      data-testid="product-card"
      className="group relative overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 hover:-translate-y-0.5 hover:border-green-600 hover:shadow-lg"
    >
      {/* Whole-card link (stretched over the card); interactive children below
          sit above it via z-index so they stay independently clickable. */}
      <Link
        href={productHref}
        aria-label={title}
        className="absolute inset-0 z-0 rounded-xl focus:outline-none"
      />

      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-green-50">
        <Image
          src={image}
          alt={title}
          fill
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
            soldOut ? "opacity-60 grayscale" : ""
          }`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {soldOut && (
          <div className="absolute inset-x-0 bottom-0 bg-ink-900/70 py-1 text-center text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Ausverkauft
          </div>
        )}

        {/* Certificate count badge */}
        {certs.length > 0 && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-green-600 shadow-sm backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" />
            {certs.length}
          </div>
        )}

        {/* Category badge */}
        {product.category?.name && (
          <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
            {product.category.name}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="space-y-1.5 p-3 sm:p-4">
        {sellerName &&
          (sellerHref ? (
            <Link
              href={sellerHref}
              className="relative z-10 inline-block text-xs font-semibold uppercase tracking-wider text-green-600 hover:text-green-600 hover:underline"
            >
              {sellerName}
            </Link>
          ) : (
            <span className="block text-xs font-semibold uppercase tracking-wider text-green-600">
              {sellerName}
            </span>
          ))}
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
          {product.name ?? product.title}
        </h3>
        {product.shortDesc && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {product.shortDesc}
          </p>
        )}

        {/* Certificate chips */}
        {certs.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {certs.slice(0, 2).map((cert) => (
              <span
                key={cert.id}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${certStyle(cert.certificateType)}`}
              >
                {certLabel(cert.certificateType)}
              </span>
            ))}
            {certs.length > 2 && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                +{certs.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-base font-bold text-foreground">{formatEuro(price)}</span>
          <span
            className={`text-xs font-medium ${soldOut ? "text-muted-foreground" : "text-green-600"}`}
          >
            {soldOut ? "Ausverkauft" : "Auf Lager"}
          </span>
        </div>
        {/* § 1 PAngV: MwSt.-Hinweis auch auf der Produktkarte (#155). Plain text,
            da die ganze Karte bereits ein gestreckter Link ist. */}
        <p className="mt-0.5 text-[11px] text-muted-foreground">inkl. MwSt., zzgl. Versand</p>
      </div>
    </article>
  )
}
