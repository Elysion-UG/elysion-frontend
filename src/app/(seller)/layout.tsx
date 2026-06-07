import type { Metadata } from "next"
import SellerShell from "@/src/components/layout/SellerShell"

export const metadata: Metadata = {
  title: "Elysion — Seller Portal",
  description: "Verwalten Sie Ihre Produkte, Bestellungen und Zertifikate.",
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerShell>{children}</SellerShell>
}
