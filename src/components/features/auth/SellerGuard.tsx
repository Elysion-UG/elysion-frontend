"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/src/context/AuthContext"
import { loginPathWithRedirect } from "@/src/lib/auth/redirect-param"
import { Loader2, ShieldAlert } from "lucide-react"

/**
 * SellerGuard — wraps all seller portal pages.
 * Redirects unauthenticated users and non-sellers to the seller login.
 * Shows a loading spinner while auth state resolves to prevent a flash of the dashboard.
 */
export default function SellerGuard({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isSeller = isAuthenticated && role === "SELLER"

  useEffect(() => {
    if (isLoading) return
    if (!isSeller) {
      // Preserve the requested page so login can return the user there (#121).
      router.replace(loginPathWithRedirect("/login/seller", pathname))
    }
  }, [isSeller, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!isSeller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-green-600" />
        <p className="text-sm text-sand-page/70">Zugriff verweigert. Weiterleitung…</p>
      </div>
    )
  }

  return <>{children}</>
}
