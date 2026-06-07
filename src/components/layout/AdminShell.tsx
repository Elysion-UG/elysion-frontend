"use client"

import { useState, Suspense } from "react"
import { ShieldCheck } from "lucide-react"
import AdminGuard from "@/src/components/features/auth/AdminGuard"
import AdminSidebar, { AdminMobileMenuButton } from "./AdminSidebar"

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-slate-950">
        <Suspense fallback={null}>
          <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800/60 bg-slate-950 px-4 py-3 lg:hidden">
            <AdminMobileMenuButton onClick={() => setMobileOpen(true)} />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyber-500" />
              <span className="font-mono text-sm font-semibold tracking-wider text-slate-200">
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
