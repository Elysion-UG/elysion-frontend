import Link from "next/link"
import { Leaf, Store } from "lucide-react"
import { sellerUrl } from "@/src/lib/seller-url"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Leaf className="h-5 w-5 text-teal-600" />
              <span className="font-bold text-slate-800">Elysion</span>
            </div>
            <p className="text-sm text-slate-500">
              Nachhaltig zertifizierte Produkte — fair, transparent, ökologisch.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Informationen</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-slate-500 hover:text-teal-600">
                  Über uns
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-500 hover:text-teal-600">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Seller CTA */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Für Verkäufer</h3>
            <p className="mb-3 text-sm text-slate-500">
              Verkaufen Sie Ihre zertifizierten Produkte auf Elysion.
            </p>
            <a
              href={sellerUrl("/login/seller")}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-600 transition-colors hover:bg-teal-50"
            >
              <Store className="h-4 w-4" />
              Seller Portal
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {year} Elysion. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  )
}
