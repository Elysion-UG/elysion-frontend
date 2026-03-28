"use client"

import type React from "react"
import { useAuth } from "@/src/context/AuthContext"
import type { UserRole } from "@/src/types"
import { ShieldAlert, Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  fallbackMessage?: string
}

export default function AuthGuard({
  children,
  requiredRoles,
  fallbackMessage = "Sie haben keinen Zugriff auf diese Seite.",
}: AuthGuardProps) {
  const { isAuthenticated, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldAlert className="w-16 h-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Anmeldung erforderlich</h2>
        <p className="text-slate-600 max-w-md">
          Bitte melden Sie sich an, um auf diese Seite zuzugreifen.
        </p>
      </div>
    )
  }

  if (requiredRoles && role && !requiredRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldAlert className="w-16 h-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Zugriff verweigert</h2>
        <p className="text-slate-600 max-w-md">{fallbackMessage}</p>
      </div>
    )
  }

  return <>{children}</>
}
