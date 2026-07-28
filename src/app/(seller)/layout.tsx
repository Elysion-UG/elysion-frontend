import type { Metadata } from "next"
import SellerShell from "@/src/components/layout/SellerShell"

export const metadata: Metadata = {
  title: "Elysion — Seller Portal",
  description: "Verwalten Sie Ihre Produkte, Bestellungen und Zertifikate.",
}

// Nonce-basierte CSP erfordert dynamisches Rendering (#37) — siehe (admin)/layout.
export const dynamic = "force-dynamic"

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerShell>{children}</SellerShell>
}
