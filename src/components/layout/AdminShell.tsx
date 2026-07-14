"use client"

import { useState, Suspense } from "react"
import { ShieldCheck } from "lucide-react"
import AdminGuard from "@/src/components/features/auth/AdminGuard"
import AdminSidebar, { AdminMobileMenuButton } from "./AdminSidebar"

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <AdminGuard>
      {/* Admin ist eine dauerhaft dunkle Oberfläche: `dark` skopt die Design-
          System-Tokens (foreground/card/border …) auf ihre Ink-Dark-Werte, damit
          der migrierte Seiteninhalt korrekt auf Ink rendert. */}
      <div className="dark flex min-h-screen bg-ink-900">
        <Suspense fallback={null}>
          <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-ink-900 px-4 py-3 lg:hidden">
            <AdminMobileMenuButton onClick={() => setMobileOpen(true)} />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span className="font-heading text-sm font-semibold tracking-[0.14em] text-sand-page">
                Elysion Admin
              </span>
            </div>
          </div>

          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminGuard>
  )
}
