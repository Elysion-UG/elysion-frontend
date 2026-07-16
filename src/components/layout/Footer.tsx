"use client"

import Link from "next/link"
import { Store, ShieldCheck } from "lucide-react"
import { sellerUrl, adminUrl } from "@/src/lib/seller-url"
import { useAuth } from "@/src/context/AuthContext"
import { BrandLogo } from "@/src/components/shared/BrandLogo"

export default function Footer() {
  const year = new Date().getFullYear()
  const { isAuthenticated } = useAuth()

  const linkClass =
    "relative text-sand-page/70 transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-200 hover:text-sand-page hover:after:w-full"

  return (
    // Dunkles Band = Ink (Guide 02), Text in Sand-Hell.
    <footer className="bg-ink-900 text-sand-page/75">
      {/* Trust-Band — Schild + Check zuerst (Guide 05) */}
      <div className="border-b border-white/10 bg-ink-900/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 text-xs text-sand-page/60">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
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
              <BrandLogo variant="mark" inverted markSize={26} />
              <div className="flex flex-col leading-none">
                <span className="font-heading text-base font-semibold tracking-[0.18em] text-sand-page">
                  ELYSION
                </span>
                <span className="font-eyebrow text-[10px] font-semibold uppercase tracking-[0.12em] text-green-500">
                  Transparent · Fair · Geprüft
                </span>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-sand-page/60">
              Elysion verbindet Menschen mit Unternehmen, die verantwortungsvoll wirtschaften — fair
              in der Lieferkette, schonend für die Umwelt und transparent in allem was sie tun.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-sand-page/55">
              Informationen
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className={linkClass}>
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className={linkClass}>
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Kontakt
                </Link>
              </li>
              {isAuthenticated && (
                <li>
                  <Link href="/praeferenzen" className={linkClass}>
                    Meine Präferenzen
                  </Link>
                </li>
              )}
              <li>
                <a
                  href={adminUrl("/login/admin")}
                  className="text-sand-page/40 transition-colors hover:text-sand-page/70"
                >
                  Admin Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Seller CTA */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-sand-page/55">
              Für Verkäufer
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-sand-page/60">
              Verkaufen Sie Ihre zertifizierten Produkte einem bewussten Publikum.
            </p>
            <a
              href={sellerUrl("/login/seller")}
              className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-green-600 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-500 transition-colors duration-200 ease-brand hover:bg-green-500/20 hover:text-sand-page"
            >
              <Store className="h-4 w-4" />
              Seller Portal öffnen
            </a>
          </div>
        </div>

        {/* Legal links */}
        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-sand-page/40">© {year} Elysion — Alle Rechte vorbehalten.</p>
            <nav aria-label="Rechtliche Links">
              <ul className="flex flex-wrap gap-4 text-xs text-sand-page/50">
                <li>
                  <Link href="/impressum" className="transition-colors hover:text-sand-page/80">
                    Impressum
                  </Link>
                </li>
                <li>
                  <Link href="/datenschutz" className="transition-colors hover:text-sand-page/80">
                    Datenschutz
                  </Link>
                </li>
                <li>
                  <Link href="/agb" className="transition-colors hover:text-sand-page/80">
                    AGB
                  </Link>
                </li>
                <li>
                  <Link href="/widerruf" className="transition-colors hover:text-sand-page/80">
                    Widerrufsrecht
                  </Link>
                </li>
                <li>
                  <Link href="/versand" className="transition-colors hover:text-sand-page/80">
                    Versand &amp; Preise
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
