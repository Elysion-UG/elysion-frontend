/**
 * Allowlist-Validierung für vom Backend gelieferte Stripe-Redirect-URLs.
 *
 * Schützt vor Open-Redirect/Phishing, falls das Backend kompromittiert ist oder
 * eine fehlerhafte URL liefert. Die Prüfung parst die URL und vergleicht den
 * Hostnamen exakt — ein `startsWith`-Vergleich wäre über Look-alike-Hosts wie
 * `connect.stripe.com.evil.com` umgehbar.
 */

const ALLOWED_STRIPE_HOSTS = ["connect.stripe.com", "dashboard.stripe.com"] as const

export function isAllowedStripeRedirect(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  return (
    parsed.protocol === "https:" &&
    (ALLOWED_STRIPE_HOSTS as readonly string[]).includes(parsed.hostname)
  )
}

export function assertStripeRedirectUrl(url: string): string {
  if (!isAllowedStripeRedirect(url)) {
    throw new Error("Ungültige Redirect-URL")
  }

  return url
}
