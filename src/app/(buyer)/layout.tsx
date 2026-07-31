import type React from "react"
import AuthGuard from "@/src/components/features/auth/AuthGuard"

// Buyer pages require authentication. AuthGuard handles the check client-side
// (sessionStorage + AuthContext) — no dependency on server-side cookies.
//
// Note: /cart deliberately lives in the (public) group, NOT here — a guest must
// be able to view and edit their cart (backed by the cartSessionId cookie).
// Login is only enforced at /checkout via the LoginRequired step (#81).
//
// Server Component (kein "use client"): so greift die Route-Segment-Config
// `dynamic` — nonce-basierte CSP erfordert dynamisches Rendering (#37, FE#23).
// Der client-seitige AuthGuard wird als Child weiterhin ganz normal gerendert.
export const dynamic = "force-dynamic"

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
