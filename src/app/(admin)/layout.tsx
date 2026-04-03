import type { Metadata } from "next"
import AdminShell from "@/src/components/layout/AdminShell"

export const metadata: Metadata = {
  title: "Elysion — Admin Portal",
  description: "Verwaltung und Monitoring des Elysion Marktplatzes.",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
