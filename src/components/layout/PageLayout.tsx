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
import LoginModal from "@/src/components/features/auth/LoginModal"
import Footer from "@/src/components/layout/Footer"
import { sellerUrl } from "@/src/lib/seller-url"
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
      className="flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-sage-700"
    >
      {icon}
      {label}
    </Link>
  )

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      {/* WCAG 2.1 / BFSG: Skip-Navigation für Tastaturnutzer und Screenreader */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-sage-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Zum Inhalt springen
      </a>
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600 shadow-sm">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight text-stone-900">Elysion</span>
                <span className="hidden text-[10px] font-medium tracking-wide text-sage-600 sm:block">
                  Nachhaltig. Zertifiziert.
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              {navLink("/", "Shop")}
              {navLink("/about", "Über uns")}
              {navLink("/contact", "Kontakt")}

              {isAuthenticated && (
                <>
                  {navLink("/praeferenzen", "Präferenzen", <Settings className="h-3.5 w-3.5" />)}
                  {navLink("/profil", "Profil", <User className="h-3.5 w-3.5" />)}
                  {role === "BUYER" &&
                    navLink("/orders", "Bestellungen", <PackageSearch className="h-3.5 w-3.5" />)}
                </>
              )}

              {isAuthenticated && role === "SELLER" && (
                <a
                  href={sellerUrl("/seller-dashboard")}
                  className="flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Verkäufer
                </a>
              )}

              {isAuthenticated &&
                role === "ADMIN" &&
                navLink("/admin/users", "Admin", <ShieldCheck className="h-3.5 w-3.5" />)}

              <Link
                href="/cart"
                className="relative flex items-center text-stone-500 transition-colors hover:text-stone-900"
              >
                <ShoppingCart className="h-5 w-5" />
                {mounted && totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-sage-600 text-[10px] font-bold text-white">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>

              {authLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-stone-300" />
              ) : isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 text-sm font-medium text-stone-400 transition-colors hover:text-red-600"
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
                  className="rounded-lg bg-bark-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-bark-800"
                >
                  Anmelden
                </button>
              )}
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-stone-600 md:hidden"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="mt-3 flex flex-col gap-3 border-t border-stone-100 pb-3 pt-3 md:hidden">
              {navLink("/", "Shop")}
              {navLink("/about", "Über uns")}
              {navLink("/contact", "Kontakt")}
              {isAuthenticated &&
                navLink("/praeferenzen", "Präferenzen", <Settings className="h-3.5 w-3.5" />)}
              {isAuthenticated && navLink("/profil", "Profil", <User className="h-3.5 w-3.5" />)}
              {isAuthenticated &&
                role === "BUYER" &&
                navLink("/orders", "Bestellungen", <PackageSearch className="h-3.5 w-3.5" />)}
              {isAuthenticated && role === "SELLER" && (
                <a
                  href={sellerUrl("/seller-dashboard")}
                  className="flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Verkäufer
                </a>
              )}
              {isAuthenticated &&
                role === "ADMIN" &&
                navLink("/admin/users", "Admin", <ShieldCheck className="h-3.5 w-3.5" />)}
              <Link
                href="/cart"
                className="flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
              >
                <ShoppingCart className="h-4 w-4" />
                Warenkorb
                {mounted && totalItems > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sage-600 text-[10px] font-bold text-white">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>
              {!authLoading &&
                (isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-500"
                  >
                    <LogOut className="h-4 w-4" /> Abmelden
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    className="rounded-lg bg-bark-700 px-4 py-2 text-sm font-medium text-white"
                  >
                    Anmelden
                  </button>
                ))}
            </nav>
          )}
        </div>
      </header>

      <main id="main-content" className="container mx-auto flex-1 px-4 py-8">
        {children}
      </main>
      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}
