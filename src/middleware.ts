import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

function hasSession(request: NextRequest): boolean {
  return request.cookies.has("refreshToken")
}

// ── Middleware ─────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Seller domain ────────────────────────────────────────────────────────
  if (isSellerDomain(request)) {
    const isSellerPath =
      SELLER_PROTECTED.some((r) => pathname.startsWith(r)) ||
      SELLER_PUBLIC.some((r) => pathname.startsWith(r)) ||
      pathname === "/"

    // Any non-seller path → redirect to buyer domain (shop pages don't belong here)
    if (!isSellerPath) {
      return NextResponse.redirect(new URL(pathname, buyerOrigin(request)))
    }

    // Root → redirect to dashboard (client-side AuthGuard handles login redirect)
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/seller-dashboard", request.url))
    }

    return NextResponse.next()
  }

  // ── Admin domain ─────────────────────────────────────────────────────────
  if (isAdminDomain(request)) {
    const isAdminPath =
      ADMIN_PROTECTED.some((r) => pathname.startsWith(r)) ||
      ADMIN_PUBLIC.some((r) => pathname.startsWith(r)) ||
      pathname === "/"

    // Any non-admin path → redirect to buyer domain (shop pages don't belong here)
    if (!isAdminPath) {
      return NextResponse.redirect(new URL(pathname, buyerOrigin(request)))
    }

    // Root → redirect to dashboard (client-side AdminGuard handles login redirect)
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }

    return NextResponse.next()
  }

  // ── Main / buyer domain ──────────────────────────────────────────────────

  // Redirect all seller entry points to the seller domain when configured
  const isSellerEntryPoint =
    SELLER_PROTECTED.some((r) => pathname.startsWith(r)) || pathname.startsWith("/login/seller")

  if (isSellerEntryPoint) {
    const sellerDomain = process.env.SELLER_DOMAIN
    if (sellerDomain) {
      const target = new URL(pathname, `${request.nextUrl.protocol}//${sellerDomain}`)
      return NextResponse.redirect(target)
    }
    // No seller domain configured → protect seller-dashboard with session check
    if (SELLER_PROTECTED.some((r) => pathname.startsWith(r)) && !hasSession(request)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // Redirect all admin entry points to the admin domain when configured
  const isAdminEntryPoint =
    ADMIN_PROTECTED.some((r) => pathname.startsWith(r)) || pathname.startsWith("/login/admin")

  if (isAdminEntryPoint) {
    const adminDomain = process.env.ADMIN_DOMAIN
    if (adminDomain) {
      const target = new URL(pathname, `${request.nextUrl.protocol}//${adminDomain}`)
      return NextResponse.redirect(target)
    }
    // No admin domain configured → protect admin routes with session check
    if (ADMIN_PROTECTED.some((r) => pathname.startsWith(r)) && !hasSession(request)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // Buyer auth is handled client-side by AuthGuard in the (buyer) layout.
  // The middleware cookie check was unreliable because the backend's HttpOnly
  // refreshToken cookie may not be visible here (wrong Path/Domain attributes
  // after proxying). Client-side guards use sessionStorage + AuthContext which
  // is always in sync with the actual auth state.
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
}
