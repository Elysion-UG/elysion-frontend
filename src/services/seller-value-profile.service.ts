/**
 * SellerValueProfileService — API calls for the seller's sustainability value profile.
 *
 * Endpoints (base: /api/v1/users/me/seller/value-profile):
 *   GET /   — get current value profile
 *   PUT /   — create or update value profile
 *
 * Levels: STANDARD | LEVEL_2 | LEVEL_3
 */
import { apiRequest } from "@/src/lib/api-client"
import type { SellerValueProfile, SellerValueProfileLevel } from "@/src/types"

export const SellerValueProfileService = {
  async get(): Promise<SellerValueProfile> {
    return apiRequest("/api/v1/users/me/seller/value-profile")
  },

  async upsert(dto: {
    level: SellerValueProfileLevel
    payload?: string
    score?: number
  }): Promise<SellerValueProfile> {
    return apiRequest("/api/v1/users/me/seller/value-profile", {
      method: "PUT",
      body: JSON.stringify(dto),
    })
  },
}
