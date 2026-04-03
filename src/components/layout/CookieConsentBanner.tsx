"use client"

import Link from "next/link"
import { Cookie } from "lucide-react"
import { useCookieConsent } from "@/src/context/CookieConsentContext"

/**
 * TTDSG § 25: Cookie-Consent-Banner.
 * Zeigt sich, solange keine Entscheidung getroffen wurde.
 * Technisch notwendige Speicher (sessionStorage für Auth) benötigen keine Einwilligung.
 * Funktionale Speicher (localStorage für Gäste-Warenkorb, Produkt-Cache) erfordern Opt-in.
 */
export default function CookieConsentBanner() {
  const { status, isHydrated, accept, decline } = useCookieConsent()

  if (!isHydrated || status !== "pending") return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie-Einwilligung"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white shadow-xl sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-xl sm:border"
    >
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Cookie className="h-5 w-5 text-sage-600" />
          <h2 className="text-sm font-semibold text-stone-800">Cookie-Einstellungen</h2>
        </div>
        <p className="mb-1 text-xs leading-relaxed text-stone-600">
          Wir verwenden technisch notwendige Cookies für den Login-Betrieb. Mit Ihrer Einwilligung
          nutzen wir außerdem <strong>funktionale Cookies</strong> (lokaler Speicher) für den
          Gäste-Warenkorb und schnellere Ladezeiten.
        </p>
        <p className="mb-4 text-xs text-stone-500">
          Weitere Informationen in unserer{" "}
          <Link href="/datenschutz" className="text-sage-600 underline hover:text-sage-800">
            Datenschutzerklärung
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <button
            onClick={decline}
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            Nur notwendige
          </button>
          <button
            onClick={accept}
            className="flex-1 rounded-lg bg-sage-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-sage-700"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  )
}
