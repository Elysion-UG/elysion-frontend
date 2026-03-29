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
