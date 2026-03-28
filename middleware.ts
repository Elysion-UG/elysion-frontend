import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication (any role)
const protectedRoutes = ["/profil", "/onboarding"]
// Routes that require BUYER role
const buyerRoutes = ["/cart", "/checkout", "/orders", "/praeferenzen"]
// Routes that require SELLER role
const sellerRoutes = ["/seller-dashboard"]
// Routes that require ADMIN role
const adminRoutes = ["/admin"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected =
    protectedRoutes.some((r) => pathname.startsWith(r)) ||
    buyerRoutes.some((r) => pathname.startsWith(r)) ||
    sellerRoutes.some((r) => pathname.startsWith(r)) ||
    adminRoutes.some((r) => pathname.startsWith(r))

  if (isProtected) {
    const hasRefreshToken = request.cookies.has("refresh_token")
    if (!hasRefreshToken) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
}
