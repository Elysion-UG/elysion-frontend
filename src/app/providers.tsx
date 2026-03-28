"use client"

import type React from "react"
import { AuthProvider } from "@/src/context/AuthContext"
import { CartProvider } from "@/src/context/CartContext"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <Toaster richColors position="top-right" />
      </CartProvider>
    </AuthProvider>
  )
}
