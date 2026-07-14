import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DEFAULT_BACKEND_HOST } from "@/src/lib/constants/backend-host.mjs"
import { SESSION_MARKER_COOKIE } from "@/src/lib/auth/session-marker"

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

// Buyer portal: paths that require an authenticated session. Login lives on the
// buyer domain root ("/"), so a missing session redirects there. Public shop
// pages (product listing/detail, producers, about, contact) and the cart
// (intentionally guest-accessible) are NOT listed.
const BUYER_PROTECTED = ["/checkout", "/orders", "/profil", "/praeferenzen", "/onboarding"]

// ── Helpers ────────────────────────────────────────────────────────────────
// Strict exact-match against the configured portal domain. Any other host
// (including foreign hosts pointed via DNS at this server) falls through to
// the buyer/main-domain branch.
//
// The previous `startsWith("seller.")` heuristic was too permissive — a host
// like `seller.evil.example.com` would have been treated as the seller portal
// and could have triggered redirects/CSP relaxations meant for trusted users.

function hostMatches(host: string, configured: string | undefined): boolean {
  return !!configured && host === configured
}

function isSellerDomain(request: NextRequest): boolean {
  const host = request.headers.get("host") ?? ""
  return hostMatches(host, process.env.SELLER_DOMAIN)
}

function isAdminDomain(request: NextRequest): boolean {
  const host = request.headers.get("host") ?? ""
  return hostMatches(host, process.env.ADMIN_DOMAIN)
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

// ── Session presence (first line of defence) ───────────────────────────────
// The HttpOnly `refreshToken` cookie is scoped to /api/v1/auth and is therefore
// invisible to the middleware on navigation requests — so we cannot check it
// directly. Instead the auth proxy emits a non-sensitive `session_present`
// marker cookie (Path=/) alongside it (#68): login and successful refresh set
// it, logout clears it. Its mere presence lets us redirect obviously-
// unauthenticated visitors away from protected routes before any Server
// Component runs.
//
// This is defence-in-depth, NOT authorisation: the marker carries no token and
// is forgeable. The client-side guards (AuthGuard / SellerGuard / AdminGuard)
// and the backend remain the real enforcement. Its purpose is to ensure a
// protected route never renders server-side for a visitor with no session at
// all — closing the gap before any protected Server Component with backend
// fetching is introduced (see #37).
//
// NOT cleared on refresh FAILURE: when a refresh 401s (revoked/expired token),
// neither the backend nor the client clears any cookie, so the marker — like
// the real refresh cookie — lingers until its shared Max-Age expires. A stale
// marker only lets a request PASS the first-line gate; the client guards still
// deny. Do not treat "marker present" as "session valid" (see #37 before
// adding any server-side data fetching to gated routes).
function hasSessionMarker(request: NextRequest): boolean {
  return !!request.cookies.get(SESSION_MARKER_COOKIE)?.value
}

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

// Backend host for img-src / connect-src. Default lives in a single shared
// constant (see backend-host.mjs); override via NEXT_PUBLIC_BACKEND_HOST.
const BACKEND_HOST = process.env.NEXT_PUBLIC_BACKEND_HOST || DEFAULT_BACKEND_HOST
const BACKEND_ORIGIN = `https://${BACKEND_HOST}`

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
    `img-src 'self' data: blob: ${BACKEND_ORIGIN}`,
    `connect-src 'self' ${BACKEND_ORIGIN} https://js.stripe.com`,
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

    // Root → dashboard when a session marker is present, otherwise straight to
    // the login. Checking the marker here avoids a needless second redirect
    // (/ → /seller-dashboard → /login/seller) for unauthenticated visitors (#120).
    if (pathname === "/") {
      const target = hasSessionMarker(request) ? "/seller-dashboard" : "/login/seller"
      const res = NextResponse.redirect(new URL(target, request.url))
      applySecurityHeaders(request, res, nonce)
      return res
    }

    // First line of defence (#68): no session marker → send to the seller login.
    if (SELLER_PROTECTED.some((r) => pathname.startsWith(r)) && !hasSessionMarker(request)) {
      const res = NextResponse.redirect(new URL("/login/seller", request.url))
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

    // Root → admin area when a session marker is present, otherwise straight to
    // the login. Checking the marker here avoids a needless second redirect
    // (/ → /admin → /login/admin) for unauthenticated visitors (#120).
    if (pathname === "/") {
      const target = hasSessionMarker(request) ? "/admin" : "/login/admin"
      const res = NextResponse.redirect(new URL(target, request.url))
      applySecurityHeaders(request, res, nonce)
      return res
    }

    // First line of defence (#68): no session marker → send to the admin login.
    if (ADMIN_PROTECTED.some((r) => pathname.startsWith(r)) && !hasSessionMarker(request)) {
      const res = NextResponse.redirect(new URL("/login/admin", request.url))
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

  // First line of defence (#68): protected buyer routes require a session
  // marker. Login lives on the buyer domain root, so redirect there. The
  // client-side AuthGuard still performs the full auth/role check afterwards.
  if (BUYER_PROTECTED.some((r) => pathname.startsWith(r)) && !hasSessionMarker(request)) {
    const res = NextResponse.redirect(new URL("/", request.url))
    applySecurityHeaders(request, res, nonce)
    return res
  }

  // Remaining buyer auth (role checks, post-marker) is handled client-side by
  // AuthGuard in the (buyer) layout.
  const res = nextWithNonce()
  applySecurityHeaders(request, res, nonce)
  return res
}

export const config = {
  // Skip static assets in /public — otherwise the middleware redirects icon
  // requests on seller/admin domains to the buyer domain, producing redirect
  // loops for any URL that is not a recognised portal path.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$|api/).*)",
  ],
}
