"use client"

import Link from "next/link"
import { Leaf, Store, ShieldCheck } from "lucide-react"
import { sellerUrl, adminUrl } from "@/src/lib/seller-url"
import { useAuth } from "@/src/context/AuthContext"

export default function Footer() {
  const year = new Date().getFullYear()
  const { isAuthenticated } = useAuth()

  return (
    <footer className="bg-bark-900 text-bark-300">
      {/* Certification highlight bar */}
      <div className="border-b border-bark-800 bg-bark-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 text-xs text-bark-400">
              <ShieldCheck className="h-3.5 w-3.5 text-sage-500" />
              <span>Nur geprüfte, zertifizierte Produkte — jedes mit Nachweis</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + mission */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600 shadow-sm">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-white">Elysion</span>
                <span className="text-[10px] font-medium tracking-wide text-sage-500">
                  Nachhaltig. Zertifiziert.
                </span>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-bark-400">
              Elysion verbindet Menschen mit Unternehmen, die verantwortungsvoll wirtschaften — fair
              in der Lieferkette, schonend für die Umwelt und transparent in allem was sie tun.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-bark-400">
              Informationen
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="relative text-bark-300 transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-200 hover:text-white hover:after:w-full"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="relative text-bark-300 transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-200 hover:text-white hover:after:w-full"
                >
                  Über uns
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="relative text-bark-300 transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-200 hover:text-white hover:after:w-full"
                >
                  Kontakt
                </Link>
              </li>
              {isAuthenticated && (
                <li>
                  <Link
                    href="/praeferenzen"
                    className="relative text-bark-300 transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-200 hover:text-white hover:after:w-full"
                  >
                    Meine Präferenzen
                  </Link>
                </li>
              )}
              <li>
                <a
                  href={adminUrl("/login/admin")}
                  className="text-bark-600 transition-colors hover:text-bark-400"
                >
                  Admin Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Seller CTA */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-bark-400">
              Für Verkäufer
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-bark-400">
              Verkaufen Sie Ihre zertifizierten Produkte einem bewussten Publikum.
            </p>
            <a
              href={sellerUrl("/login/seller")}
              className="inline-flex items-center gap-2 rounded-lg border border-sage-700 bg-sage-700/20 px-4 py-2.5 text-sm font-medium text-sage-300 transition-colors hover:border-sage-600 hover:bg-sage-700/40 hover:text-white"
            >
              <Store className="h-4 w-4" />
              Seller Portal öffnen
            </a>
          </div>
        </div>

        {/* Legal links */}
        <div className="mt-12 border-t border-bark-800 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-bark-600">© {year} Elysion — Alle Rechte vorbehalten.</p>
            <nav aria-label="Rechtliche Links">
              <ul className="flex flex-wrap gap-4 text-xs text-bark-500">
                <li>
                  <Link href="/impressum" className="transition-colors hover:text-bark-300">
                    Impressum
                  </Link>
                </li>
                <li>
                  <Link href="/datenschutz" className="transition-colors hover:text-bark-300">
                    Datenschutz
                  </Link>
                </li>
                <li>
                  <Link href="/agb" className="transition-colors hover:text-bark-300">
                    AGB
                  </Link>
                </li>
                <li>
                  <Link href="/widerruf" className="transition-colors hover:text-bark-300">
                    Widerrufsrecht
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
