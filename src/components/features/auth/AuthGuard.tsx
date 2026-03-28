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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-slate-400" />
        <h2 className="mb-2 text-2xl font-bold text-slate-800">Anmeldung erforderlich</h2>
        <p className="max-w-md text-slate-600">
          Bitte melden Sie sich an, um auf diese Seite zuzugreifen.
        </p>
      </div>
    )
  }

  if (requiredRoles && role && !requiredRoles.includes(role)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-slate-400" />
        <h2 className="mb-2 text-2xl font-bold text-slate-800">Zugriff verweigert</h2>
        <p className="max-w-md text-slate-600">{fallbackMessage}</p>
      </div>
    )
  }

  return <>{children}</>
}
