/**
 * BuyerValueProfileService — API calls for the buyer's sustainability value profile.
 *
 * Lives on /api/v1/users/me/profile — not /users/me/value-profile.
 *
 * API quirks handled here (transparent to callers):
 *   - activeProfileType: API uses uppercase ("NONE"/"SIMPLE"/"EXTENDED");
 *     we map to/from our lowercase ValuesProfileType ("none"/"simple"/"extended").
 *   - simpleProfile / extendedProfile: API expects/returns JSON strings, not objects.
 *     We serialize on write and parse on read so callers always work with plain objects.
 */
import { z } from "zod"
import { apiRequest } from "@/src/lib/api-client"
import type { BuyerValueProfile, BuyerValueProfileUpsertDTO, ValuesProfileType } from "@/src/types"

// Guard schemas for the JSON-string profile fields the backend delivers.
// The data is only rendered as weights/labels (never executed), so the guard is
// deliberately lenient about value ranges — its job is to reject a wrong *shape*
// (contract drift / corrupt cache) rather than to re-validate the domain rules,
// which live server-side. See #173 (F3).
const simpleProfileSchema = z.record(z.string(), z.number())
const extendedProfileSchema = z.record(z.string(), z.record(z.string(), z.number()))

function toApiProfileType(t: ValuesProfileType): string {
  return t.toUpperCase()
}

function fromApiProfileType(t: string): ValuesProfileType {
  return t.toLowerCase() as ValuesProfileType
}

/**
 * Parse a backend JSON-string (or already-decoded object) and validate its shape
 * with `schema` instead of an unchecked `as T` cast. Returns null when the field
 * is absent, the JSON is malformed, or the decoded value fails the shape guard.
 */
function parseProfileField<T>(value: unknown, schema: z.ZodType<T>): T | null {
  if (value == null) return null
  let decoded: unknown = value
  if (typeof value === "string") {
    try {
      decoded = JSON.parse(value)
    } catch {
      return null
    }
  }
  const result = schema.safeParse(decoded)
  return result.success ? result.data : null
}

export const BuyerValueProfileService = {
  async get(): Promise<BuyerValueProfile> {
    const raw = await apiRequest<BuyerValueProfile>("/api/v1/users/me/profile")
    return {
      ...raw,
      activeProfileType: fromApiProfileType(raw.activeProfileType as unknown as string),
      simpleProfile: parseProfileField(raw.simpleProfile, simpleProfileSchema),
      extendedProfile: parseProfileField(raw.extendedProfile, extendedProfileSchema),
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
      simpleProfile: parseProfileField(raw.simpleProfile, simpleProfileSchema),
      extendedProfile: parseProfileField(raw.extendedProfile, extendedProfileSchema),
    }
  },
}
