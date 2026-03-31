"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  ShoppingCart,
  PackageSearch,
} from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { useCart } from "@/src/hooks/useCart"
import LoginModal from "@/src/components/LoginModal"
import { toast } from "sonner"

interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  const { isAuthenticated, isLoading: authLoading, role, logout } = useAuth()
  const { totalItems } = useCart()
  const router = useRouter()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      toast.success("Erfolgreich abgemeldet.")
    } catch {
      // logout() clears local state via finally — state is already cleared
    } finally {
      setLoggingOut(false)
      router.push("/")
    }
  }

  const navLink = (href: string, label: string, icon?: React.ReactNode) => (
    <Link
      key={href}
      href={href}
      className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
    >
      {icon}
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Leaf className="h-7 w-7 text-teal-600" />
              <span className="text-xl font-bold text-slate-800">Elysion</span>
            </Link>

            <nav className="hidden items-center gap-5 md:flex">
              {navLink("/", "Home")}
              {navLink("/about", "About")}
              {navLink("/contact", "Kontakt")}

              {isAuthenticated && (
                <>
                  {navLink("/praeferenzen", "Präferenzen", <Settings className="h-4 w-4" />)}
                  {navLink("/profil", "Profil", <User className="h-4 w-4" />)}
                  {role === "BUYER" &&
                    navLink("/orders", "Bestellungen", <PackageSearch className="h-4 w-4" />)}
                </>
              )}

              {isAuthenticated &&
                role === "SELLER" &&
                navLink("/seller-dashboard", "Verkäufer", <BarChart3 className="h-4 w-4" />)}

              {isAuthenticated &&
                role === "ADMIN" &&
                navLink("/admin/users", "Admin", <ShieldCheck className="h-4 w-4" />)}

              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
              >
                <ShoppingCart className="h-5 w-5" />
                {mounted && totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>

              {/* Hide auth button while session is being restored to avoid a
                  flash of the "Anmelden" button on every page reload */}
              {authLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : isAuthenticated ? (
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
                role === "BUYER" &&
                navLink("/orders", "Bestellungen", <PackageSearch className="h-4 w-4" />)}
              {isAuthenticated &&
                role === "SELLER" &&
                navLink("/seller-dashboard", "Verkäufer", <BarChart3 className="h-4 w-4" />)}
              {isAuthenticated &&
                role === "ADMIN" &&
                navLink("/admin/users", "Admin", <ShieldCheck className="h-4 w-4" />)}
              <Link
                href="/cart"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
              >
                <ShoppingCart className="h-4 w-4" />
                Warenkorb
              </Link>
              {!authLoading &&
                (isAuthenticated ? (
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
                ))}
            </nav>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}
