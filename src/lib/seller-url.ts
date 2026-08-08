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
 * Baut den Link zur Produzenten-Seite — der einzige Ort, an dem diese URL
 * entsteht (ProductCard, ProductDetail, SustainableShop ziehen darüber mit).
 *
 * Bevorzugt wird `?slug=`: nur damit lässt sich das öffentliche Profil
 * (`GET /api/v1/sellers/{slug}`, #104) laden. Die Produktlisten liefern heute
 * allerdings nur `seller.userId` — solange das so ist, entsteht `?id=<uuid>`,
 * und die Seite fällt auf die aus der Produktliste abgeleitete Darstellung
 * zurück. Bereits geteilte `?id=`-Links bleiben damit gültig.
 *
 * Die Route bleibt `/producer`; eine SEO-URL `/produzenten/{slug}` ist eine
 * eigene Entscheidung und bewusst nicht Teil dieser Funktion.
 */
export function producerHref(
  seller: { slug?: string | null; userId?: string | null } | null | undefined
): string | null {
  if (seller?.slug) return `/producer?slug=${encodeURIComponent(seller.slug)}`
  if (seller?.userId) return `/producer?id=${encodeURIComponent(seller.userId)}`
  return null
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
