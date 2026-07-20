"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useMounted } from "@/src/hooks/use-mounted"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
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
import { useCart } from "@/src/context/CartContext"
import LoginModal from "@/src/components/features/auth/LoginModal"
import Footer from "@/src/components/layout/Footer"
import { BrandLogo } from "@/src/components/shared/BrandLogo"
import { sellerUrl, adminUrl } from "@/src/lib/seller-url"
import { readRedirectTarget } from "@/src/lib/auth/redirect-param"
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
  // Deep link the visitor was bounced off by the middleware (#68), carried here
  // as ?redirect=. When present and the visitor is unauthenticated, auto-open
  // the login modal and return them there after a successful login (#121).
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null)
  const mounted = useMounted()

  // Once auth has resolved to "unauthenticated", surface the login modal for a
  // deep-link visitor the middleware forwarded here. Reacting to the async auth
  // state is a legitimate effect; the setState it drives is the sanctioned
  // exception (mirrors CartContext / CookieConsentContext).
  useEffect(() => {
    if (authLoading || isAuthenticated) return
    const target = readRedirectTarget(window.location.search, "")
    if (target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRedirectTarget(target)
      setIsLoginModalOpen(true)
    }
  }, [authLoading, isAuthenticated])

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false)
    if (redirectTarget) {
      const target = redirectTarget
      setRedirectTarget(null)
      router.push(target)
    }
  }

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
      className="relative flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-green-500 after:transition-all after:duration-200 hover:text-foreground hover:after:w-full"
    >
      {icon}
      {label}
    </Link>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* WCAG 2.1 / BFSG: Skip-Navigation für Tastaturnutzer und Screenreader */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-green-500 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink-900 focus:shadow-lg"
      >
        Zum Inhalt springen
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Elysion — Startseite">
              <BrandLogo variant="mark" markSize={26} />
              <div className="flex flex-col leading-none">
                <span className="font-heading text-base font-semibold tracking-[0.18em] text-foreground">
                  ELYSION
                </span>
                <span className="hidden font-eyebrow text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:block">
                  Transparent · Fair · Geprüft
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
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Verkäufer
                </a>
              )}

              {isAuthenticated && role === "ADMIN" && (
                <a
                  href={adminUrl("/admin/users")}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </a>
              )}

              <Link
                href="/cart"
                aria-label="Warenkorb"
                className="relative flex items-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <ShoppingCart className="h-5 w-5" />
                {mounted && totalItems > 0 && (
                  <span
                    key={totalItems}
                    className="absolute -right-2 -top-2 flex h-4 w-4 animate-bounce-subtle items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-ink-900"
                  >
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>

              {authLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-green-600"
                >
                  Anmelden
                </button>
              )}
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground md:hidden"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="mt-3 flex animate-fade-in flex-col gap-3 border-t border-border pb-3 pt-3 md:hidden">
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
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Verkäufer
                </a>
              )}
              {isAuthenticated && role === "ADMIN" && (
                <a
                  href={adminUrl("/admin/users")}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </a>
              )}
              <Link
                href="/cart"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ShoppingCart className="h-4 w-4" />
                Warenkorb
                {mounted && totalItems > 0 && (
                  <span
                    key={totalItems}
                    className="flex h-4 w-4 animate-bounce-subtle items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-ink-900"
                  >
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>
              {!authLoading &&
                (isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
                  >
                    <LogOut className="h-4 w-4" /> Abmelden
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-green-600"
                  >
                    Anmelden
                  </button>
                ))}
            </nav>
          )}
        </div>
      </header>

      <main id="main-content" className="container mx-auto flex-1 animate-fade-in px-4 py-8">
        {children}
      </main>
      <Footer />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}
