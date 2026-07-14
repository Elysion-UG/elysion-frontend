"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, PackageOpen, Store } from "lucide-react"
import { useSellerProducts } from "@/src/hooks/useSellerProducts"
import ProductCard from "./ProductCard"

export default function ProducerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sellerId = searchParams.get("id")

  const { data, isLoading, error } = useSellerProducts(sellerId)

  const products = data?.products ?? []
  const companyName = data?.companyName ?? "Verkäufer"
  const logoInitial = companyName.charAt(0).toUpperCase() || "?"
  const productCount = data?.totalElements ?? 0

  // Not-found / error: render only the error state — no placeholder header card
  // with fabricated "Verkäufer / 0 Produkte" data (mirrors the product detail page).
  if (!sellerId || error) {
    return (
      <div className="min-h-screen bg-secondary">
        <BackBanner onBack={() => router.back()} />
        <div className="container mx-auto px-4">
          {!sellerId ? (
            <EmptyState
              title="Verkäufer nicht gefunden"
              message="Es wurde kein Verkäufer angegeben."
            />
          ) : (
            <EmptyState
              title="Produkte konnten nicht geladen werden"
              message="Bitte versuche es später erneut."
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary">
      <BackBanner onBack={() => router.back()} />

      <div className="container mx-auto px-4">
        {/* Header card */}
        <div className="relative -mt-12 mb-8 rounded-xl bg-white p-6 shadow-lg md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="-mt-16 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border-4 border-white bg-green-500 shadow-lg sm:mt-0 md:h-24 md:w-24">
              <span className="text-3xl font-bold text-ink-900 md:text-4xl">{logoInitial}</span>
            </div>
            <div>
              <h1 className="text-2xl font-normal text-foreground md:text-3xl">{companyName}</h1>
              {!isLoading && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  {productCount} {productCount === 1 ? "Produkt" : "Produkte"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content states */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 pb-12 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-xl border border-border bg-white"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="Keine Produkte"
            message="Dieser Verkäufer hat aktuell keine aktiven Produkte."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-12 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                productHref={
                  product.slug ? `/product?slug=${product.slug}` : `/product?id=${product.id}`
                }
                sellerHref={null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface BackBannerProps {
  onBack: () => void
}

/** Neutral banner with a back button — no fabricated hero imagery. */
function BackBanner({ onBack }: BackBannerProps) {
  return (
    <div className="relative h-40 bg-ink-900 md:h-52">
      <button
        onClick={onBack}
        className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-sand-page transition-colors hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </button>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  message: string
}

function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <PackageOpen className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
