"use client"

import { useState, Suspense } from "react"
import SellerGuard from "@/src/components/features/auth/SellerGuard"
import SellerSidebar, { SellerMobileMenuButton } from "./SellerSidebar"
import { BrandLogo } from "@/src/components/shared/BrandLogo"

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SellerGuard>
      <div className="flex min-h-screen bg-background">
        <Suspense fallback={null}>
          <SellerSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
            <SellerMobileMenuButton onClick={() => setMobileOpen(true)} />
            <div className="flex items-center gap-2">
              <BrandLogo variant="mark" markSize={22} />
              <span className="font-heading text-sm font-semibold tracking-[0.14em] text-foreground">
                Elysion Portal
              </span>
            </div>
          </div>

          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SellerGuard>
  )
}
