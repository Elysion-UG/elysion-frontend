/**
 * BuyerValueProfileService — API calls for the buyer's sustainability value profile.
 *
 * Endpoints:
 *   GET /api/v1/users/me/profile  — get current value profile
 *   PUT /api/v1/users/me/profile  — upsert value profile
 *
 * API quirks handled here (transparent to callers):
 *   - activeProfileType: API uses uppercase ("NONE"/"SIMPLE"/"EXTENDED");
 *     we map to/from our lowercase ValuesProfileType ("none"/"simple"/"extended").
 *   - simpleProfile / extendedProfile: API expects/returns JSON strings, not objects.
 *     We serialize on write and parse on read so callers always work with plain objects.
 */
import { apiRequest } from "@/src/lib/api-client"
import type { BuyerValueProfile, BuyerValueProfileUpsertDTO, ValuesProfileType } from "@/src/types"

function toApiProfileType(t: ValuesProfileType): string {
  return t.toUpperCase()
}

function fromApiProfileType(t: string): ValuesProfileType {
  return t.toLowerCase() as ValuesProfileType
}

function parseProfileField<T>(value: unknown): T | null {
  if (value == null) return null
  if (typeof value === "string") {
    try { return JSON.parse(value) as T } catch { return null }
  }
  return value as T
}

export const BuyerValueProfileService = {
  async get(): Promise<BuyerValueProfile> {
    const raw = await apiRequest<BuyerValueProfile>("/api/v1/users/me/profile")
    return {
      ...raw,
      activeProfileType: fromApiProfileType(raw.activeProfileType as unknown as string),
      simpleProfile: parseProfileField<Record<string, number>>(raw.simpleProfile),
      extendedProfile: parseProfileField<Record<string, Record<string, number>>>(raw.extendedProfile),
    }
  },

  async upsert(dto: BuyerValueProfileUpsertDTO): Promise<BuyerValueProfile> {
    const payload = {
      activeProfileType: toApiProfileType(dto.activeProfileType),
      simpleProfile: dto.simpleProfile != null ? JSON.stringify(dto.simpleProfile) : null,
      extendedProfile: dto.extendedProfile != null ? JSON.stringify(dto.extendedProfile) : null,
    }
    const raw = await apiRequest<BuyerValueProfile>("/api/v1/users/me/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return {
      ...raw,
      activeProfileType: fromApiProfileType(raw.activeProfileType as unknown as string),
      simpleProfile: parseProfileField<Record<string, number>>(raw.simpleProfile),
      extendedProfile: parseProfileField<Record<string, Record<string, number>>>(raw.extendedProfile),
    }
  },
}
