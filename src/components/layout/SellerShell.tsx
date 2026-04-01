"use client"

import { useState, Suspense } from "react"
import { Leaf } from "lucide-react"
import SellerSidebar, { SellerMobileMenuButton } from "./SellerSidebar"

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Suspense fallback={null}>
        <SellerSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <SellerMobileMenuButton onClick={() => setMobileOpen(true)} />
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-teal-600" />
            <span className="text-sm font-semibold text-slate-800">Elysion Portal</span>
          </div>
        </div>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
