import type { OrderProductSnapshot } from "@/src/types"

// ── Raw backend shape ─────────────────────────────────────────────────────────

export interface ApiOrderProductSnapshot {
  id?: string
  name?: string
  slug?: string
  seller?: { id?: string } | null
  variantId?: string
  sku?: string
  options?: Array<{ type: string; value: string }>
  currency?: string
}

// ── Normalizer ────────────────────────────────────────────────────────────────

export function normalizeSnapshot(
  raw: ApiOrderProductSnapshot | undefined | null
): OrderProductSnapshot {
  return {
    productId: raw?.id,
    productName: raw?.name,
    productSlug: raw?.slug,
    sellerId: raw?.seller?.id,
    variantId: raw?.variantId,
    sku: raw?.sku,
    options: raw?.options,
    currency: raw?.currency,
  }
}
