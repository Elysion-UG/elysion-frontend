"use client"

import type React from "react"
import { useEffect } from "react"
import { useAuth } from "@/src/context/AuthContext"
import { Loader2 } from "lucide-react"

/**
 * BuyerGuard — wraps pages that are only for BUYER (and unauthenticated) users.
 * Logged-in SELLERs are redirected immediately to /seller-dashboard.
 * ADMINs are redirected to /admin/users.
 * Shows a spinner while auth state is loading to prevent flash.
 */
export default function BuyerGuard({ children }: { children: React.ReactNode }) {
  const { role, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (role === "SELLER") {
      window.location.replace("/seller-dashboard")
    } else if (role === "ADMIN") {
      window.location.replace("/admin/users")
    }
  }, [role, isLoading])

  if (isLoading || role === "SELLER" || role === "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return <>{children}</>
}
