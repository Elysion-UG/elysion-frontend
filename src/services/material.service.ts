/**
 * MaterialService — API calls for material master data.
 *
 * Public:
 *   GET /api/v1/materials   — list of materials (wrapped ApiResponse)
 *
 * Used by the storefront material filter facet and the seller product form.
 */
import { apiRequest } from "@/src/lib/api-client"
import type { Material } from "@/src/types"

export const MaterialService = {
  async list(): Promise<Material[]> {
    return apiRequest("/api/v1/materials")
  },
}
