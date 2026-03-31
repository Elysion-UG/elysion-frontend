import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ── Route definitions ──────────────────────────────────────────────────────

// Seller portal: only these paths are reachable on the seller domain
const SELLER_PROTECTED = ["/seller-dashboard"]
const SELLER_PUBLIC = ["/login/seller", "/reset-password", "/verify-email"]

// Buyer / main shop
const BUYER_PROTECTED = ["/profil", "/onboarding"]
const BUYER_ONLY = ["/cart", "/checkout", "/orders", "/praeferenzen"]
const ADMIN_ONLY = ["/admin"]

// ── Helpers ────────────────────────────────────────────────────────────────

function isSellerDomain(request: NextRequest): boolean {
  const host = request.headers.get("host") ?? ""
  const configured = process.env.SELLER_DOMAIN
  return host.startsWith("seller.") || (!!configured && host === configured)
}

function hasSession(request: NextRequest): boolean {
  return request.cookies.has("refresh_token")
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

    // Any non-seller path → send to dashboard (or login if no session)
    if (!isSellerPath) {
      const target = hasSession(request) ? "/seller-dashboard" : "/login/seller"
      return NextResponse.redirect(new URL(target, request.url))
    }

    // Protect the dashboard itself
    if (SELLER_PROTECTED.some((r) => pathname.startsWith(r)) && !hasSession(request)) {
      return NextResponse.redirect(new URL("/login/seller", request.url))
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

  // Normal auth checks for buyer / admin routes
  const isProtected =
    BUYER_PROTECTED.some((r) => pathname.startsWith(r)) ||
    BUYER_ONLY.some((r) => pathname.startsWith(r)) ||
    ADMIN_ONLY.some((r) => pathname.startsWith(r))

  if (isProtected && !hasSession(request)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
}
