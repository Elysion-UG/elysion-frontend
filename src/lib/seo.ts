import { buyerUrl } from "./seller-url"

/**
 * Absolute base URL of the public storefront, or undefined when
 * NEXT_PUBLIC_BUYER_DOMAIN is not configured (local dev). Used as
 * `metadata.metadataBase` so relative OG/canonical URLs resolve.
 */
export function siteUrl(): URL | undefined {
  const base = buyerUrl("/")
  return base.startsWith("http") ? new URL(base) : undefined
}

/** Collapses whitespace and truncates to a meta-description-friendly length. */
export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}
