"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/src/context/AuthContext"
import { Loader2, ShieldAlert } from "lucide-react"

/**
 * SellerGuard — wraps all seller portal pages.
 * Redirects unauthenticated users and non-sellers to the seller login.
 * Shows a loading spinner while auth state resolves to prevent a flash of the dashboard.
 */
export default function SellerGuard({ children }: { children: React.ReactNode }) {
  const { role, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const isSeller = isAuthenticated && role === "SELLER"

  useEffect(() => {
    if (isLoading) return
    if (!isSeller) {
      router.replace("/login/seller")
    }
  }, [isSeller, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!isSeller) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-teal-700" />
        <p className="text-sm text-slate-500">Zugriff verweigert. Weiterleitung…</p>
      </div>
    )
  }

  return <>{children}</>
}
