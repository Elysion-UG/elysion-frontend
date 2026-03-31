/**
 * Builds an absolute URL on the seller domain.
 * Falls back to a relative path if NEXT_PUBLIC_SELLER_DOMAIN is not configured.
 */
export function sellerUrl(path: string = "/"): string {
  const domain = process.env.NEXT_PUBLIC_SELLER_DOMAIN
  if (!domain) return path
  const protocol = domain.includes("localhost") ? "http" : "https"
  return `${protocol}://${domain}${path}`
}

/**
 * Builds an absolute URL on the buyer (main shop) domain.
 * Falls back to "/" if NEXT_PUBLIC_BUYER_DOMAIN is not configured.
 */
export function buyerUrl(path: string = "/"): string {
  const domain = process.env.NEXT_PUBLIC_BUYER_DOMAIN
  if (!domain) return path
  const protocol = domain.includes("localhost") ? "http" : "https"
  return `${protocol}://${domain}${path}`
}
