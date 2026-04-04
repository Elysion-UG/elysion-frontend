/**
 * SellerProfileService — API calls for the seller's own profile.
 *
 * Endpoints (base: /api/v1/users/me/seller-profile):
 *   GET   /   — get seller profile (SELLER role only)
 *   PATCH /   — update companyName
 */
import { apiRequest } from "@/src/lib/api-client"
import type { SellerProfile } from "@/src/types"

export const SellerProfileService = {
  async get(): Promise<SellerProfile> {
    return apiRequest("/api/v1/users/me/seller-profile")
  },

  async update(dto: Partial<{ companyName: string }>): Promise<SellerProfile> {
    return apiRequest("/api/v1/users/me/seller-profile", {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },
}
