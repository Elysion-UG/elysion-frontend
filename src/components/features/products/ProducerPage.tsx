"use client"

import type React from "react"
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

  const handleProductClick = (slug: string | undefined, id: string) => {
    router.push(slug ? `/product?slug=${slug}` : `/product?id=${id}`)
  }

  // The cards already belong to this seller — the seller link is a no-op here.
  const handleSellerClick = (e: React.MouseEvent, _sellerId?: string) => {
    e.stopPropagation()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Neutral banner — no fabricated hero imagery */}
      <div className="relative h-40 bg-gradient-to-br from-sage-600 to-teal-700 md:h-52">
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm text-white transition-colors hover:bg-black/40"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>
      </div>

      <div className="container mx-auto px-4">
        {/* Header card */}
        <div className="relative -mt-12 mb-8 rounded-xl bg-white p-6 shadow-lg md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="-mt-16 flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border-4 border-white bg-teal-600 shadow-lg sm:mt-0 md:h-24 md:w-24">
              <span className="text-3xl font-bold text-white md:text-4xl">{logoInitial}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800 md:text-3xl">{companyName}</h1>
              {!isLoading && !error && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
                  <Store className="h-4 w-4" />
                  {productCount} {productCount === 1 ? "Produkt" : "Produkte"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content states */}
        {!sellerId ? (
          <EmptyState
            title="Verkäufer nicht gefunden"
            message="Es wurde kein Verkäufer angegeben."
          />
        ) : isLoading ? (
          <div className="grid gap-5 pb-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-xl border border-stone-200 bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Produkte konnten nicht geladen werden"
            message="Bitte versuche es später erneut."
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="Keine Produkte"
            message="Dieser Verkäufer hat aktuell keine aktiven Produkte."
          />
        ) : (
          <div className="grid gap-5 pb-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={handleProductClick}
                onSellerClick={handleSellerClick}
              />
            ))}
          </div>
        )}
      </div>
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
      <PackageOpen className="h-12 w-12 text-stone-300" />
      <h2 className="text-lg font-semibold text-stone-700">{title}</h2>
      <p className="text-sm text-stone-500">{message}</p>
    </div>
  )
}
