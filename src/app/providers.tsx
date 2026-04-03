"use client"

import type React from "react"
import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/src/context/AuthContext"
import { CartProvider } from "@/src/context/CartContext"
import { CookieConsentProvider } from "@/src/context/CookieConsentContext"
import { ErrorProvider } from "@/src/context/ErrorContext"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  // useState so each browser session gets its own client (no cross-request sharing in SSR).
  const [queryClient] = useState(() => new QueryClient())

  return (
    <ErrorProvider>
      <QueryClientProvider client={queryClient}>
        <CookieConsentProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster richColors position="top-right" />
            </CartProvider>
          </AuthProvider>
        </CookieConsentProvider>
      </QueryClientProvider>
    </ErrorProvider>
  )
}
