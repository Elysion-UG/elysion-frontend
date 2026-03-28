"use client"

import { useEffect, useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { RecommendationService } from "@/src/services/recommendation.service"
import { useAuth } from "@/src/context/AuthContext"
import type { Recommendation } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"

export default function RecommendationsWidget() {
  const { isAuthenticated, role } = useAuth()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || role !== "BUYER") return
    setIsLoading(true)
    RecommendationService.getRecommendations(6)
      .then(setRecommendations)
      .catch(() => {
        // Silently hide — recommendations are non-critical
      })
      .finally(() => setIsLoading(false))
  }, [isAuthenticated, role])

  if (!isAuthenticated || role !== "BUYER") return null
  if (isLoading) {
    return (
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <h2 className="text-xl font-bold text-slate-800">Für dich empfohlen</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-teal-600" />
        <h2 className="text-xl font-bold text-slate-800">Für dich empfohlen</h2>
        <span className="text-sm text-slate-500">basierend auf deinen Werten</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommendations.map((rec) => (
          <a
            key={rec.productId}
            href={`/product?slug=${rec.slug}`}
            className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-teal-300 transition-all"
          >
            <div className="aspect-square bg-slate-100 relative overflow-hidden">
              {rec.imageUrl ? (
                <img
                  src={rec.imageUrl}
                  alt={rec.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Sparkles className="w-8 h-8" />
                </div>
              )}
              <span className="absolute top-2 right-2 bg-teal-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {Math.round(rec.matchScore)}%
              </span>
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-slate-800 truncate">{rec.name}</p>
              <p className="text-xs text-teal-700 font-semibold mt-0.5">{formatEuro(rec.basePrice)}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
