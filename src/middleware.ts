import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ── Startup guard ──────────────────────────────────────────────────────────
// Fail fast if portal domains are not configured. Without these, the middleware
// cannot route correctly and portal isolation silently breaks.
;(function assertDomainConfig() {
  const missing = (["SELLER_DOMAIN", "ADMIN_DOMAIN", "BUYER_DOMAIN"] as const).filter(
    (k) => !process.env[k]
  )
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Set them in .env.local (dev) or your deployment environment (prod)."
    )
  }
})()

// ── Route definitions ──────────────────────────────────────────────────────

// Seller portal: only these paths are reachable on the seller domain
const SELLER_PROTECTED = ["/seller-dashboard"]
const SELLER_PUBLIC = ["/login/seller", "/reset-password", "/verify-email"]

// Admin portal: only these paths are reachable on the admin domain
const ADMIN_PROTECTED = ["/admin"]
const ADMIN_PUBLIC = ["/login/admin", "/reset-password", "/verify-email"]

// Buyer auth is handled client-side by AuthGuard (see src/app/(buyer)/layout.tsx)

// ── Helpers ────────────────────────────────────────────────────────────────

function isSellerDomain(request: NextRequest): boolean {
  const host = request.headers.get("host") ?? ""
  const configured = process.env.SELLER_DOMAIN
  return host.startsWith("seller.") || (!!configured && host === configured)
}

function isAdminDomain(request: NextRequest): boolean {
  const host = request.headers.get("host") ?? ""
  const configured = process.env.ADMIN_DOMAIN
  return host.startsWith("admin.") || (!!configured && host === configured)
}

function buyerOrigin(request: NextRequest): string {
  const domain = process.env.BUYER_DOMAIN
  if (domain) {
    const protocol = domain.includes("localhost") ? "http" : "https"
    return `${protocol}://${domain}`
  }
  // Fallback: strip "admin." / "seller." prefix from current host
  const host = request.headers.get("host") ?? "localhost:3000"
  const bare = host.replace(/^(admin|seller)\./, "")
  const protocol = bare.includes("localhost") ? "http" : "https"
  return `${protocol}://${bare}`
}

// NOTE: No cookie-based session check here. The refresh cookie is scoped to
// /api/v1/auth and is not visible to the middleware on navigation requests.
// All auth gating is performed by the client-side AuthGuard / AdminGuard /
// SellerGuard components, which read the actual AuthContext state.

// ── Content Security Policy ────────────────────────────────────────────────
// A fresh nonce is generated per request so inline bootstrap scripts emitted
// by Next.js can be executed without 'unsafe-inline'. The nonce travels via an
// `x-nonce` request header that Next.js reads during SSR. Dev mode still needs
// 'unsafe-eval' for HMR / React Fast Refresh.
//
// style-src retains 'unsafe-inline' because Radix UI / recharts inject inline
// style attributes that can't currently be nonce-tagged. Tightening this is
// tracked as a separate follow-up — nonce-tagging styles requires either
// a CSS-in-JS migration or a Radix upstream change.

const isDev = process.env.NODE_ENV !== "production"

function buildCsp(nonce: string): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "https://js.stripe.com",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ")

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://marketplace-backend-1-1w30.onrender.com",
    "connect-src 'self' https://marketplace-backend-1-1w30.onrender.com https://js.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")
}

function generateNonce(): string {
  // crypto.randomUUID is available in the edge runtime; strip dashes to get
  // a CSP-safe alphanumeric token.
  return crypto.randomUUID().replace(/-/g, "")
}

function applySecurityHeaders(request: NextRequest, response: NextResponse, nonce: string): void {
  response.headers.set("Content-Security-Policy", buildCsp(nonce))
  // Expose the nonce to downstream request handlers via the request header on
  // the cloned response — already applied on `request` by the caller.
  void request
}

// ── Middleware ─────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const nonce = generateNonce()
  const csp = buildCsp(nonce)

  // Forward the nonce to the app so <Script nonce={…}> and Next.js' own
  // inline bootstrap scripts can adopt it during SSR.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", csp)

  const nextWithNonce = () => NextResponse.next({ request: { headers: requestHeaders } })

  // ── Seller domain ────────────────────────────────────────────────────────
  if (isSellerDomain(request)) {
    const isSellerPath =
      SELLER_PROTECTED.some((r) => pathname.startsWith(r)) ||
      SELLER_PUBLIC.some((r) => pathname.startsWith(r)) ||
      pathname === "/"

    // Any non-seller path → redirect to buyer domain (shop pages don't belong here)
    if (!isSellerPath) {
      const res = NextResponse.redirect(new URL(pathname, buyerOrigin(request)))
      applySecurityHeaders(request, res, nonce)
      return res
    }

    // Root → redirect to dashboard (client-side AuthGuard handles login redirect)
    if (pathname === "/") {
      const res = NextResponse.redirect(new URL("/seller-dashboard", request.url))
      applySecurityHeaders(request, res, nonce)
      return res
    }

    const res = nextWithNonce()
    applySecurityHeaders(request, res, nonce)
    return res
  }

  // ── Admin domain ─────────────────────────────────────────────────────────
  if (isAdminDomain(request)) {
    const isAdminPath =
      ADMIN_PROTECTED.some((r) => pathname.startsWith(r)) ||
      ADMIN_PUBLIC.some((r) => pathname.startsWith(r)) ||
      pathname === "/"

    // Any non-admin path → redirect to buyer domain (shop pages don't belong here)
    if (!isAdminPath) {
      const res = NextResponse.redirect(new URL(pathname, buyerOrigin(request)))
      applySecurityHeaders(request, res, nonce)
      return res
    }

    // Root → redirect to dashboard (client-side AdminGuard handles login redirect)
    if (pathname === "/") {
      const res = NextResponse.redirect(new URL("/admin", request.url))
      applySecurityHeaders(request, res, nonce)
      return res
    }

    const res = nextWithNonce()
    applySecurityHeaders(request, res, nonce)
    return res
  }

  // ── Main / buyer domain ──────────────────────────────────────────────────

  // Redirect all seller entry points to the seller domain when configured
  const isSellerEntryPoint =
    SELLER_PROTECTED.some((r) => pathname.startsWith(r)) || pathname.startsWith("/login/seller")

  if (isSellerEntryPoint) {
    const sellerDomain = process.env.SELLER_DOMAIN
    if (sellerDomain) {
      const target = new URL(pathname, `${request.nextUrl.protocol}//${sellerDomain}`)
      const res = NextResponse.redirect(target)
      applySecurityHeaders(request, res, nonce)
      return res
    }
    // No seller domain configured → client-side SellerGuard handles auth
    const res = nextWithNonce()
    applySecurityHeaders(request, res, nonce)
    return res
  }

  // Redirect all admin entry points to the admin domain when configured
  const isAdminEntryPoint =
    ADMIN_PROTECTED.some((r) => pathname.startsWith(r)) || pathname.startsWith("/login/admin")

  if (isAdminEntryPoint) {
    const adminDomain = process.env.ADMIN_DOMAIN
    if (adminDomain) {
      const target = new URL(pathname, `${request.nextUrl.protocol}//${adminDomain}`)
      const res = NextResponse.redirect(target)
      applySecurityHeaders(request, res, nonce)
      return res
    }
    // No admin domain configured → client-side AdminGuard handles auth
    const res = nextWithNonce()
    applySecurityHeaders(request, res, nonce)
    return res
  }

  // Buyer auth is handled client-side by AuthGuard in the (buyer) layout.
  const res = nextWithNonce()
  applySecurityHeaders(request, res, nonce)
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
}
