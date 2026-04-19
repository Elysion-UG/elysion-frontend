"use client"

import { RouteErrorFallback } from "@/src/components/shared/RouteErrorFallback"

export default function AdminError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteErrorFallback
      {...props}
      routeGroup="admin"
      homeHref="/admin/users"
      homeLabel="Admin-Startseite"
      theme="dark"
    />
  )
}
