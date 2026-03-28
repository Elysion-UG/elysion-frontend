import { apiRequest } from "@/src/lib/api-client"
import type { Recommendation } from "@/src/types"

export const RecommendationService = {
  /**
   * Get personalized product recommendations for the authenticated buyer.
   * GET /api/v1/recommendations?limit={limit}
   */
  async getRecommendations(limit = 6): Promise<Recommendation[]> {
    return apiRequest<Recommendation[]>(`/api/v1/recommendations?limit=${limit}`)
  },
}
