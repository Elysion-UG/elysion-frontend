/**
 * Builds an absolute URL on the seller domain.
 * Falls back to a relative path if NEXT_PUBLIC_SELLER_DOMAIN is not configured.
 *
 * Usage:
 *   sellerUrl()                   → "http://seller.localhost:3000/"
 *   sellerUrl("/seller-dashboard") → "http://seller.localhost:3000/seller-dashboard"
 */
export function sellerUrl(path: string = "/"): string {
  const domain = process.env.NEXT_PUBLIC_SELLER_DOMAIN
  if (!domain) return path
  const protocol = domain.includes("localhost") ? "http" : "https"
  return `${protocol}://${domain}${path}`
}
