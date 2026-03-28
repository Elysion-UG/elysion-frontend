"use client"

import type React from "react"
import { useState } from "react"
import {
  Leaf,
  Settings,
  User,
  LogOut,
  ShieldCheck,
  BarChart3,
  Menu,
  X,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import LoginModal from "@/src/components/LoginModal"
import { toast } from "sonner"

interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  const { isAuthenticated, role, logout } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      toast.success("Erfolgreich abgemeldet.")
      window.location.href = "/"
    } finally {
      setLoggingOut(false)
    }
  }

  const navLink = (href: string, label: string, icon?: React.ReactNode) => (
    <a
      key={href}
      href={href}
      className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
    >
      {icon}
      {label}
    </a>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <Leaf className="h-7 w-7 text-teal-600" />
              <span className="text-xl font-bold text-slate-800">Elysion</span>
            </a>

            <nav className="hidden items-center gap-5 md:flex">
              {navLink("/", "Home")}
              {navLink("/about", "About")}
              {navLink("/contact", "Kontakt")}

              {isAuthenticated && (
                <>
                  {navLink("/praeferenzen", "Präferenzen", <Settings className="h-4 w-4" />)}
                  {navLink("/profil", "Profil", <User className="h-4 w-4" />)}
                </>
              )}

              {isAuthenticated &&
                role === "SELLER" &&
                navLink("/seller-dashboard", "Verkäufer", <BarChart3 className="h-4 w-4" />)}

              {isAuthenticated &&
                role === "ADMIN" &&
                navLink("/admin/users", "Admin", <ShieldCheck className="h-4 w-4" />)}

              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-red-600"
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  Abmelden
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  Anmelden
                </button>
              )}
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-700 md:hidden"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="mt-3 flex flex-col gap-3 border-t border-slate-200 pb-3 pt-3 md:hidden">
              {navLink("/", "Home")}
              {navLink("/about", "About")}
              {navLink("/contact", "Kontakt")}
              {isAuthenticated &&
                navLink("/praeferenzen", "Präferenzen", <Settings className="h-4 w-4" />)}
              {isAuthenticated && navLink("/profil", "Profil", <User className="h-4 w-4" />)}
              {isAuthenticated &&
                role === "SELLER" &&
                navLink("/seller-dashboard", "Verkäufer", <BarChart3 className="h-4 w-4" />)}
              {isAuthenticated &&
                role === "ADMIN" &&
                navLink("/admin/users", "Admin", <ShieldCheck className="h-4 w-4" />)}
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600"
                >
                  <LogOut className="h-4 w-4" /> Abmelden
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsLoginModalOpen(true)
                    setMobileMenuOpen(false)
                  }}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Anmelden
                </button>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}
