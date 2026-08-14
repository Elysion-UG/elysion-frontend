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
 * (`GET /api/v1/sellers/{slug}`, Elysion-UG/elysion-marketplace-backend#104)
 * laden. Die öffentlichen Produkt-Reads liefern den Slug inzwischen mit, sodass
 * hier im Regelfall `?slug=` entsteht.
 *
 * `slug` ist jedoch `null`, sobald der Verkäufer nicht `APPROVED` ist — das
 * Profil antwortet für solche Verkäufer mit 404, ihre `ACTIVE`-Produkte sind
 * aber trotzdem öffentlich gelistet. Für diesen Fall (und für bereits geteilte
 * Links) bleibt `?id=<uuid>` der Rückfallweg: die Seite zeigt dann nur die aus
 * der Produktliste abgeleitete Darstellung — eingeschränkt, aber nicht tot.
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
