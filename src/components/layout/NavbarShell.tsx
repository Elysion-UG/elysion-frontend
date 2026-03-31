"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import PageLayout from "@/src/components/layout/PageLayout"

/**
 * NavbarShell — single persistent navbar instance mounted at the root layout.
 *
 * Renders PageLayout (header + main container) for all user-facing routes.
 * Routes that manage their own full-page UI (admin, auth, dev) receive their
 * children unwrapped so they can control the entire viewport themselves.
 *
 * Mounted once at the root level, this component never unmounts during
 * client-side navigation, which means:
 *   - Auth state from AuthContext is read once and stays stable.
 *   - The navbar does not re-initialise or flash on route changes.
 */

const NO_NAVBAR_PREFIXES = [
  "/admin",
  "/login",
  "/reset-password",
  "/verify-email",
  "/dev",
  "/seller-dashboard",
]

function needsNavbar(pathname: string): boolean {
  return !NO_NAVBAR_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  )
}

export default function NavbarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (needsNavbar(pathname)) {
    return <PageLayout>{children}</PageLayout>
  }

  return <>{children}</>
}
