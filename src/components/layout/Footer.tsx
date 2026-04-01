import Link from "next/link"
import { Leaf, Store } from "lucide-react"
import { sellerUrl } from "@/src/lib/seller-url"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-stone-900 text-stone-400">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-700">
                <Leaf className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white">Elysion</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-stone-500">
              Nachhaltig zertifizierte Produkte — fair, transparent und verantwortungsvoll
              hergestellt.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-500">
              Informationen
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-stone-400 transition-colors hover:text-stone-200"
                >
                  Über uns
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-stone-400 transition-colors hover:text-stone-200"
                >
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Seller CTA */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-500">
              Für Verkäufer
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-stone-500">
              Verkaufen Sie Ihre zertifizierten Produkte auf Elysion.
            </p>
            <a
              href={sellerUrl("/login/seller")}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-700 px-4 py-2 text-sm font-medium text-stone-300 transition-colors hover:border-stone-600 hover:bg-stone-800 hover:text-white"
            >
              <Store className="h-4 w-4" />
              Seller Portal
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-stone-800 pt-6 text-center text-xs text-stone-600">
          © {year} Elysion. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  )
}
