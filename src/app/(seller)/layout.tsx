import type { Metadata } from "next"
import SellerHeader from "@/src/components/layout/SellerHeader"

export const metadata: Metadata = {
  title: "Elysion — Seller Portal",
  description: "Verwalten Sie Ihre Produkte, Bestellungen und Zertifikate.",
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <SellerHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
