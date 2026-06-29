import type { ValuesProfileType } from "./user"

// ── Seller Value Profile ────────────────────────────────────────────
export type SellerValueProfileLevel = "STANDARD" | "LEVEL_2" | "LEVEL_3"

export interface SellerValueProfile {
  sellerProfileId: string
  level: SellerValueProfileLevel
  payload?: unknown
  score?: number
}

// ── Seller Product List Item ─────────────────────────────────────────
export interface SellerProductListItem {
  id: string
  slug: string
  name: string
  status: string
  price: number
  currency: string
  primaryImage?: string
  createdAt: string
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
