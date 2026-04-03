import Link from "next/link"
import { Leaf, Store } from "lucide-react"
import { sellerUrl } from "@/src/lib/seller-url"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-bark-900 text-bark-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sage-600">
                <Leaf className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white">Elysion</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-bark-400">
              Nachhaltig zertifizierte Produkte — fair, transparent und verantwortungsvoll
              hergestellt.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-bark-400">
              Informationen
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="text-bark-300 transition-colors hover:text-white">
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-bark-300 transition-colors hover:text-white">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Seller CTA */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-bark-400">
              Für Verkäufer
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-bark-400">
              Verkaufen Sie Ihre zertifizierten Produkte auf Elysion.
            </p>
            <a
              href={sellerUrl("/login/seller")}
              className="inline-flex items-center gap-2 rounded-lg border border-bark-700 px-4 py-2 text-sm font-medium text-bark-200 transition-colors hover:border-bark-600 hover:bg-bark-800 hover:text-white"
            >
              <Store className="h-4 w-4" />
              Seller Portal
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-bark-800 pt-6 text-center text-xs text-bark-500">
          © {year} Elysion. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  )
}
