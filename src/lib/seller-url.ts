/**
 * Returns true for local development domains (localhost, *.localhost, 127.x.x.x).
 * More reliable than a substring match which would incorrectly match domains like
 * "notlocalhost.com".
 */
function isLocalDomain(domain: string): boolean {
  const host = domain.split(":")[0]
  return host === "localhost" || host.endsWith(".localhost") || host.startsWith("127.")
}

/**
 * Builds an absolute URL on the seller domain.
 * Falls back to a relative path if NEXT_PUBLIC_SELLER_DOMAIN is not configured.
 */
export function sellerUrl(path: string = "/"): string {
  const domain = process.env.NEXT_PUBLIC_SELLER_DOMAIN
  if (!domain) return path
  const protocol = isLocalDomain(domain) ? "http" : "https"
  return `${protocol}://${domain}${path}`
}

/**
 * Builds an absolute URL on the buyer (main shop) domain.
 * Falls back to "/" if NEXT_PUBLIC_BUYER_DOMAIN is not configured.
 */
export function buyerUrl(path: string = "/"): string {
  const domain = process.env.NEXT_PUBLIC_BUYER_DOMAIN
  if (!domain) return path
  const protocol = isLocalDomain(domain) ? "http" : "https"
  return `${protocol}://${domain}${path}`
}

/**
 * Builds an absolute URL on the admin domain.
 * Falls back to a relative path if NEXT_PUBLIC_ADMIN_DOMAIN is not configured.
 */
export function adminUrl(path: string = "/"): string {
  const domain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN
  if (!domain) return path
  const protocol = isLocalDomain(domain) ? "http" : "https"
  return `${protocol}://${domain}${path}`
}
