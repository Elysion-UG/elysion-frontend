"use client"

import { RouteErrorFallback } from "@/src/components/shared/RouteErrorFallback"

export default function BuyerError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteErrorFallback {...props} routeGroup="buyer" homeHref="/" homeLabel="Startseite" />
}
