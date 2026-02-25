"use client"

import type React from "react"
import { useState } from "react"
import { Leaf, Settings, User, LogOut, ShieldCheck, BarChart3, Menu, X, Loader2 } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import LoginModal from "./LoginModal"
import { toast } from "sonner"

interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  const { isAuthenticated, user, role, logout, isLoading } = useAuth()
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
      className="flex items-center gap-1.5 text-slate-600 hover:text-teal-700 transition-colors font-medium text-sm"
    >
      {icon}
      {label}
    </a>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <Leaf className="w-7 h-7 text-teal-600" />
              <span className="text-xl font-bold text-slate-800">Elysion</span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-5">
              {navLink("/", "Home")}
              {navLink("/about", "About")}
              {navLink("/contact", "Kontakt")}

              {isAuthenticated && (
                <>
                  {navLink("/praeferenzen", "Präferenzen", <Settings className="w-4 h-4" />)}
                  {navLink("/profil", "Profil", <User className="w-4 h-4" />)}
                </>
              )}

              {isAuthenticated && role === "SELLER" && (
                navLink("/seller-dashboard", "Verkäufer", <BarChart3 className="w-4 h-4" />)
              )}

              {isAuthenticated && role === "ADMIN" && (
                navLink("/admin/users", "Admin", <ShieldCheck className="w-4 h-4" />)
              )}

              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-red-600 transition-colors font-medium text-sm"
                >
                  {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Abmelden
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Anmelden
                </button>
              )}
            </nav>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-700"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-3 pb-3 border-t border-slate-200 pt-3 flex flex-col gap-3">
              {navLink("/", "Home")}
              {navLink("/about", "About")}
              {navLink("/contact", "Kontakt")}
              {isAuthenticated && navLink("/praeferenzen", "Präferenzen", <Settings className="w-4 h-4" />)}
              {isAuthenticated && navLink("/profil", "Profil", <User className="w-4 h-4" />)}
              {isAuthenticated && role === "SELLER" && navLink("/seller-dashboard", "Verkäufer", <BarChart3 className="w-4 h-4" />)}
              {isAuthenticated && role === "ADMIN" && navLink("/admin/users", "Admin", <ShieldCheck className="w-4 h-4" />)}
              {isAuthenticated ? (
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-red-600 font-medium text-sm">
                  <LogOut className="w-4 h-4" /> Abmelden
                </button>
              ) : (
                <button onClick={() => { setIsLoginModalOpen(true); setMobileMenuOpen(false) }} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Anmelden
                </button>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}
