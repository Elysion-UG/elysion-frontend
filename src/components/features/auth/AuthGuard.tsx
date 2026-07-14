"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/src/context/AuthContext"
import { loginPathWithRedirect } from "@/src/lib/auth/redirect-param"
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
  const pathname = usePathname()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold text-foreground">Anmeldung erforderlich</h2>
        <p className="mb-6 max-w-md text-muted-foreground">
          Bitte melden Sie sich an, um auf diese Seite zuzugreifen.
        </p>
        <Link
          href={loginPathWithRedirect("/", pathname)}
          className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-green-700"
        >
          Jetzt anmelden
        </Link>
      </div>
    )
  }

  if (requiredRoles && role && !requiredRoles.includes(role)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold text-foreground">Zugriff verweigert</h2>
        <p className="max-w-md text-muted-foreground">{fallbackMessage}</p>
      </div>
    )
  }

  return <>{children}</>
}
