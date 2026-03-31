/**
 * product-display-cache.ts
 *
 * Lightweight localStorage cache for product display metadata (name, imageUrl, slug).
 *
 * Why this exists: neither the cart API nor the checkout preview API returns
 * product names or images. We populate this cache whenever a product is added
 * to the cart (at that point we always have the display metadata) so that the
 * checkout page can look up names and images even after a full page reload.
 */

const CACHE_KEY = "product_display_cache"
const VARIANT_OPTIONS_CACHE_KEY = "variant_options_cache"

export interface ProductDisplayEntry {
  name: string
  imageUrl?: string
  slug?: string
}

type CacheMap = Record<string, ProductDisplayEntry>

function readCache(): CacheMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as CacheMap) : {}
  } catch {
    return {}
  }
}

function writeCache(map: CacheMap): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors (private browsing quota, etc.)
  }
}

export function saveProductDisplay(productId: string, entry: ProductDisplayEntry): void {
  if (!productId || !entry.name) return
  const cache = readCache()
  writeCache({ ...cache, [productId]: entry })
}

export function getProductDisplay(productId: string): ProductDisplayEntry | null {
  if (!productId) return null
  return readCache()[productId] ?? null
}

export function getProductDisplayCache(): CacheMap {
  return readCache()
}

// ── Variant options cache ──────────────────────────────────────────────────────
// Keyed by variantId. The backend never returns human-readable variant labels
// (e.g. "Größe: XL"), so we cache them at add-to-cart time and restore them
// in normalizeCart after a backend cart load.

type VariantOption = { name: string; value: string }
type VariantOptionsMap = Record<string, VariantOption[]>

function readVariantOptionsCache(): VariantOptionsMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(VARIANT_OPTIONS_CACHE_KEY)
    return raw ? (JSON.parse(raw) as VariantOptionsMap) : {}
  } catch {
    return {}
  }
}

export function saveVariantOptions(variantId: string, options: VariantOption[]): void {
  if (!variantId || options.length === 0) return
  try {
    const cache = readVariantOptionsCache()
    localStorage.setItem(
      VARIANT_OPTIONS_CACHE_KEY,
      JSON.stringify({ ...cache, [variantId]: options })
    )
  } catch {}
}

export function getVariantOptions(variantId: string): VariantOption[] | null {
  if (!variantId) return null
  return readVariantOptionsCache()[variantId] ?? null
}
