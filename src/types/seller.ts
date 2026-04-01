import type { ValuesProfileType } from "./user"

// ── Seller Value Profile ────────────────────────────────────────────
export type SellerValueProfileLevel = "STANDARD" | "LEVEL_2" | "LEVEL_3"

export interface SellerValueProfile {
  id: string
  sellerId: string
  level: SellerValueProfileLevel
  payload?: string
  score?: number
  updatedAt: string
}

// ── Buyer Value Profile ──────────────────────────────────────────────
export interface BuyerValueProfile {
  id: string
  userId: string
  activeProfileType: ValuesProfileType
  simpleProfile: Record<string, number> | null
  extendedProfile: Record<string, Record<string, number>> | null
  updatedAt: string
}

export interface BuyerValueProfileUpsertDTO {
  activeProfileType: ValuesProfileType
  simpleProfile?: Record<string, number> | null
  extendedProfile?: Record<string, Record<string, number>> | null
}
