import type { Metadata } from "next"
import AdminShell from "@/src/components/layout/AdminShell"

export const metadata: Metadata = {
  title: "Elysion — Admin Portal",
  description: "Verwaltung und Monitoring des Elysion Marktplatzes.",
}

// Nonce-basierte CSP erfordert dynamisches Rendering (#37): das Admin-Portal
// bekommt von der Middleware eine Per-Request-Nonce, statisch vorgerenderte
// Bootstrap-Scripts würden sonst geblockt (FE#23).
export const dynamic = "force-dynamic"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
