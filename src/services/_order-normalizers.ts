import { z } from "zod"
import type { OrderProductSnapshot } from "@/src/types"

// ── Raw backend shape ─────────────────────────────────────────────────────────
// Zod mirrors the interface exactly (all fields optional/nullable as before), so
// callers get the same static type while gaining runtime validation at the
// service boundary — contract drift fails loud instead of surfacing as
// `undefined.foo` deep in the order UI (#38).

export const apiOrderProductSnapshotSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
  seller: z.object({ id: z.string().optional() }).nullish(),
  variantId: z.string().optional(),
  sku: z.string().optional(),
  options: z.array(z.object({ type: z.string(), value: z.string() })).optional(),
  currency: z.string().optional(),
})

export type ApiOrderProductSnapshot = z.infer<typeof apiOrderProductSnapshotSchema>

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
