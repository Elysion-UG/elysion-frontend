"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/src/context/AuthContext"
import { loginPathWithRedirect } from "@/src/lib/auth/redirect-param"
import { Loader2, ShieldAlert } from "lucide-react"

/**
 * AdminGuard — wraps all admin portal pages.
 * Redirects unauthenticated users and non-admins to the admin login,
 * preserving the requested page as a return URL (#121).
 * Shows a futuristic loading spinner on the dark admin background.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || role !== "ADMIN") {
      router.replace(loginPathWithRedirect("/login/admin", pathname))
    }
  }, [isAuthenticated, role, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
      </div>
    )
  }

  if (!isAuthenticated || role !== "ADMIN") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-cyber-700" />
        <p className="text-sm text-slate-400">Zugriff verweigert. Weiterleitung…</p>
      </div>
    )
  }

  return <>{children}</>
}
