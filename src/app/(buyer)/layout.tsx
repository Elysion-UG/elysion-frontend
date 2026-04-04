"use client"

import type React from "react"
import AuthGuard from "@/src/components/features/auth/AuthGuard"

// Buyer pages require authentication. AuthGuard handles the check client-side
// (sessionStorage + AuthContext) — no dependency on server-side cookies.
export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
