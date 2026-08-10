/**
 * product-display-cache.ts
 *
 * Lightweight localStorage cache for product display metadata (name, imageUrl, slug).
 *
 * Scope since #188: **orders only.** Cart and checkout deliver their own display
 * data — every cart line and every checkout line carries name, slug, primary image
 * and variant options — so neither reads this cache any more. The order detail is
 * the remaining consumer: the frozen order snapshot carries the product name but
 * no image, so `OrderDetail` resolves images once per product and memoizes them
 * here. It fills the cache itself and works with an empty one, which keeps this a
 * pure optimization rather than a correctness precondition.
 */

const CACHE_KEY = "product_display_cache"
const CONSENT_KEY = "elysion_cookie_consent"

/** TTDSG § 25: nur schreiben wenn Nutzer funktionale Cookies akzeptiert hat */
function isFunctionalConsentGiven(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(CONSENT_KEY) === "accepted"
}

export interface ProductDisplayEntry {
  name: string
  imageUrl?: string
  slug?: string
}

type CacheMap = Record<string, ProductDisplayEntry>

// Narrow a single parsed entry to the ProductDisplayEntry shape (#70.5).
// localStorage is user-writable, so a tampered blob ({ name: null, … }) must not
// reach the render logic. `name` is required (string); imageUrl/slug are optional
// strings. Anything else → entry dropped.
function isValidDisplayEntry(value: unknown): value is ProductDisplayEntry {
  if (!value || typeof value !== "object") return false
  const e = value as Record<string, unknown>
  if (typeof e.name !== "string") return false
  if (e.imageUrl !== undefined && typeof e.imageUrl !== "string") return false
  if (e.slug !== undefined && typeof e.slug !== "string") return false
  return true
}

function readCache(): CacheMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const clean: CacheMap = {}
    for (const [id, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (isValidDisplayEntry(entry)) clean[id] = entry
    }
    return clean
  } catch {
    return {}
  }
}

function writeCache(map: CacheMap): void {
  if (!isFunctionalConsentGiven()) return
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

// The variant-options cache that used to live here is gone (#188): the backend
// delivers `variant.options` on every cart and checkout line, so mirroring them
// into localStorage stored personal data for no benefit. The stale key is removed
// below on first load.
const LEGACY_VARIANT_OPTIONS_CACHE_KEY = "variant_options_cache"

export function clearLegacyVariantOptionsCache(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(LEGACY_VARIANT_OPTIONS_CACHE_KEY)
  } catch {
    // localStorage may be unavailable (private mode) — nothing to clean up then.
  }
}
