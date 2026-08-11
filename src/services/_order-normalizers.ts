import { z } from "zod"
import type { OrderProductSnapshot } from "@/src/types"

// ── Raw backend shape ─────────────────────────────────────────────────────────
// Zod mirrors `OrderProductSnapshotResponse` exactly, so callers get the same
// static type while gaining runtime validation at the service boundary —
// contract drift fails loud instead of surfacing as `undefined.foo` deep in the
// order UI (#38).
//
// Alle Felder sind `nullish`, nicht `optional`: das Backend konfiguriert Jackson
// nicht auf `NON_NULL`, ein leeres Snapshot-Feld kommt also als `null` über die
// Leitung an — und `z.string().optional()` weist `null` zurück. Ein
// Bestell-Snapshot ohne SKU hätte damit die ganze Bestellung unlesbar gemacht.

const nullableString = z.string().nullish()

export const apiOrderProductSnapshotSchema = z.object({
  id: nullableString,
  name: nullableString,
  slug: nullableString,
  seller: z.object({ id: nullableString }).nullish(),
  variantId: nullableString,
  sku: nullableString,
  // Der Vertrag garantiert die Liste (`safeOptions` ersetzt null durch `[]`);
  // `nullish` ist Defensive für Altbestände. Ein kaputtes Optionspaar schlägt
  // dagegen laut fehl — genauso wie im Warenkorb (#240).
  options: z.array(z.object({ type: z.string(), value: z.string() })).nullish(),
  currency: nullableString,
})

export type ApiOrderProductSnapshot = z.infer<typeof apiOrderProductSnapshotSchema>

// ── Normalizer ────────────────────────────────────────────────────────────────

export function normalizeSnapshot(
  raw: ApiOrderProductSnapshot | undefined | null
): OrderProductSnapshot {
  return {
    productId: raw?.id ?? undefined,
    productName: raw?.name ?? undefined,
    productSlug: raw?.slug ?? undefined,
    sellerId: raw?.seller?.id ?? undefined,
    variantId: raw?.variantId ?? undefined,
    sku: raw?.sku ?? undefined,
    options: raw?.options ?? undefined,
    currency: raw?.currency ?? undefined,
  }
}
