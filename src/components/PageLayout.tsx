"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Leaf, Settings, User, LogOut, ShieldCheck, BarChart3, Menu, X, Loader2, ShoppingCart, Package, Building2 } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { useCart } from "@/src/context/CartContext"
import LoginModal from "./LoginModal"
import { toast } from "sonner"

interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  const { isAuthenticated, user, role, logout, isLoading } = useAuth()
  const { itemCount } = useCart()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("openLogin") === "true") {
      setIsLoginModalOpen(true)
      // Clean the URL without reloading the page
      const url = new URL(window.location.href)
      url.searchParams.delete("openLogin")
      window.history.replaceState({}, "", url.toString())
    }
  }, [])

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
              {/* ── Seller nav ── */}
              {role === "SELLER" ? (
                <>
                  {navLink("/seller-dashboard", "Dashboard", <BarChart3 className="w-4 h-4" />)}
                  {navLink("/profil", "Profil", <User className="w-4 h-4" />)}
                  {navLink("/about", "About")}
                  {navLink("/contact", "Kontakt")}
                </>
              ) : role === "ADMIN" ? (
                /* ── Admin nav ── */
                <>
                  {navLink("/about", "About")}
                  {navLink("/contact", "Kontakt")}
                  <div className="relative group">
                    <button className="flex items-center gap-1.5 text-slate-600 hover:text-teal-700 transition-colors font-medium text-sm">
                      <ShieldCheck className="w-4 h-4" /> Admin
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                      {[
                        { href: "/admin/users", label: "Benutzer" },
                        { href: "/admin/sellers", label: "Verkäufer" },
                        { href: "/admin/products", label: "Produkte" },
                        { href: "/admin/certificates", label: "Zertifikate" },
                        { href: "/admin/orders", label: "Bestellungen" },
                        { href: "/admin/finance", label: "Finanzen & Wartung" },
                      ].map(item => (
                        <a key={item.href} href={item.href} className="block px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* ── Buyer / guest nav ── */
                <>
                  {navLink("/", "Home")}
                  {navLink("/about", "About")}
                  {navLink("/contact", "Kontakt")}
                  {isAuthenticated && navLink("/praeferenzen", "Präferenzen", <Settings className="w-4 h-4" />)}
                  {isAuthenticated && navLink("/profil", "Profil", <User className="w-4 h-4" />)}
                  {isAuthenticated && navLink("/orders", "Bestellungen", <Package className="w-4 h-4" />)}
                  {/* Cart icon */}
                  <a href="/cart" className="relative text-slate-600 hover:text-teal-700 transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-teal-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                        {itemCount > 9 ? "9+" : itemCount}
                      </span>
                    )}
                  </a>
                </>
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
              {isAuthenticated && role === "ADMIN" && (
                <>
                  {navLink("/admin/users", "Admin: Benutzer", <ShieldCheck className="w-4 h-4" />)}
                  {navLink("/admin/sellers", "Admin: Verkäufer")}
                  {navLink("/admin/products", "Admin: Produkte")}
                  {navLink("/admin/certificates", "Admin: Zertifikate")}
                  {navLink("/admin/orders", "Admin: Bestellungen")}
                  {navLink("/admin/finance", "Admin: Finanzen")}
                </>
              )}
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <a href="/" className="flex items-center gap-2 mb-3">
                <Leaf className="w-6 h-6 text-teal-600" />
                <span className="text-lg font-bold text-slate-800">Elysion</span>
              </a>
              <p className="text-sm text-slate-500">Nachhaltig einkaufen & verkaufen.</p>
            </div>

            {/* Shop */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Shop</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="/" className="hover:text-teal-600 transition-colors">Alle Produkte</a></li>
                <li><a href="/about" className="hover:text-teal-600 transition-colors">Über uns</a></li>
                <li><a href="/contact" className="hover:text-teal-600 transition-colors">Kontakt</a></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Mein Konto</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="/orders" className="hover:text-teal-600 transition-colors">Meine Bestellungen</a></li>
                <li><a href="/profil" className="hover:text-teal-600 transition-colors">Profil & Adressen</a></li>
                <li><a href="/praeferenzen" className="hover:text-teal-600 transition-colors">Präferenzen</a></li>
              </ul>
            </div>

            {/* Portals */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Portale</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/login/seller"
                    className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-800 font-medium transition-colors">
                    <Building2 className="w-3.5 h-3.5" />
                    Verkäufer-Portal
                  </a>
                </li>
                <li>
                  <a href="/login/admin"
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin-Bereich
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} Elysion. Alle Rechte vorbehalten.</p>
            <div className="flex gap-4 text-xs text-slate-400">
              <a href="/contact" className="hover:text-slate-600 transition-colors">Impressum</a>
              <a href="/contact" className="hover:text-slate-600 transition-colors">Datenschutz</a>
              <a href="/contact" className="hover:text-slate-600 transition-colors">AGB</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}
