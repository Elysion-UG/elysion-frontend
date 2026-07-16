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

// ── Variant options cache ──────────────────────────────────────────────────────
// Keyed by variantId. The backend never returns human-readable variant labels
// (e.g. "Größe: XL"), so we cache them at add-to-cart time and restore them
// in normalizeCart after a backend cart load.

type VariantOption = { name: string; value: string }
type VariantOptionsMap = Record<string, VariantOption[]>

// Narrow a parsed value to VariantOption[] (#70.5): an array of { name, value }
// string pairs. Tampered / malformed entries are dropped rather than rendered.
function isValidVariantOptions(value: unknown): value is VariantOption[] {
  return (
    Array.isArray(value) &&
    value.every(
      (o) =>
        !!o &&
        typeof o === "object" &&
        typeof (o as Record<string, unknown>).name === "string" &&
        typeof (o as Record<string, unknown>).value === "string"
    )
  )
}

function readVariantOptionsCache(): VariantOptionsMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(VARIANT_OPTIONS_CACHE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const clean: VariantOptionsMap = {}
    for (const [id, options] of Object.entries(parsed as Record<string, unknown>)) {
      if (isValidVariantOptions(options)) clean[id] = options
    }
    return clean
  } catch {
    return {}
  }
}

export function saveVariantOptions(variantId: string, options: VariantOption[]): void {
  if (!variantId || options.length === 0) return
  if (!isFunctionalConsentGiven()) return
  try {
    const cache = readVariantOptionsCache()
    localStorage.setItem(
      VARIANT_OPTIONS_CACHE_KEY,
      JSON.stringify({ ...cache, [variantId]: options })
    )
  } catch {
    // QuotaExceededError or private-mode restriction — cache is best-effort.
  }
}

export function getVariantOptions(variantId: string): VariantOption[] | null {
  if (!variantId) return null
  return readVariantOptionsCache()[variantId] ?? null
}
