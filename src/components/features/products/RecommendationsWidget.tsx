"use client"

import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { Sparkles, Loader2 } from "lucide-react"
import { RecommendationService } from "@/src/services/recommendation.service"
import { useAuth } from "@/src/context/AuthContext"
import { formatEuro } from "@/src/lib/currency"

export default function RecommendationsWidget() {
  const { isAuthenticated, role } = useAuth()
  const isBuyer = isAuthenticated && role === "BUYER"

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["recommendations", 6],
    queryFn: () => RecommendationService.getRecommendations(6),
    enabled: isBuyer,
    staleTime: 5 * 60 * 1000,
  })

  if (!isBuyer) return null
  if (isLoading) {
    return (
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-600" />
          <h2 className="text-xl font-bold text-slate-800">Für dich empfohlen</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-teal-600" />
        <h2 className="text-xl font-bold text-slate-800">Für dich empfohlen</h2>
        <span className="text-sm text-slate-500">basierend auf deinen Werten</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {recommendations.map((rec) => (
          <a
            key={rec.productId}
            href={`/product?slug=${rec.slug}`}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-teal-300 hover:shadow-md"
          >
            <div className="relative aspect-square overflow-hidden bg-slate-100">
              {rec.imageUrl ? (
                <Image
                  src={rec.imageUrl}
                  alt={rec.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <Sparkles className="h-8 w-8" />
                </div>
              )}
              <span className="absolute right-2 top-2 rounded-full bg-teal-600 px-1.5 py-0.5 text-xs font-bold text-white">
                {Math.round(rec.matchScore ?? rec.score)}%
              </span>
            </div>
            <div className="p-2">
              <p className="truncate text-xs font-medium text-slate-800">{rec.name}</p>
              <p className="mt-0.5 text-xs font-semibold text-teal-700">
                {formatEuro(rec.basePrice ?? rec.price ?? 0)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
