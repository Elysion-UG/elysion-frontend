import type React from "react"

// Nonce-basierte CSP erfordert dynamisches Rendering (#37): Login/Reset/Verify
// bekommen eine Per-Request-Nonce, statische Bootstrap-Scripts würden sonst
// geblockt (FE#23).
export const dynamic = "force-dynamic"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
