"use client"

import { RouteErrorFallback } from "@/src/components/shared/RouteErrorFallback"

export default function PublicError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteErrorFallback {...props} routeGroup="public" homeHref="/" homeLabel="Startseite" />
}
