// ── Recommendations ──────────────────────────────────────────────────
export interface Recommendation {
  productId: string
  slug: string
  name: string
  price?: number
  basePrice?: number
  imageUrl?: string
  score: number
  matchScore?: number
}
