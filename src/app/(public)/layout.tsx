import type React from "react"
import PageLayout from "@/src/components/PageLayout"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>
}
