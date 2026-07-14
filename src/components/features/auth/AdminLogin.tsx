"use client"

import { ShieldCheck } from "lucide-react"
import { buyerUrl } from "@/src/lib/seller-url"
import { readRedirectTarget } from "@/src/lib/auth/redirect-param"
import { LoginForm } from "@/src/components/features/auth/_shared/LoginForm"

export default function AdminLogin() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-ink-900 p-4"
      style={{
        backgroundImage:
          "linear-gradient(rgba(244,238,223,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(244,238,223,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Subtiler, statischer Akzent — kein Glow-Effekt */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/5 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <a href={buyerUrl("/")} className="mb-5 inline-flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 ring-1 ring-green-500/40">
              <ShieldCheck className="h-6 w-6 text-green-500" />
            </div>
            <span className="font-heading text-lg font-semibold tracking-[0.2em] text-sand-page">
              ELYSION
            </span>
          </a>
          <div className="inline-flex items-center gap-2 rounded-full border border-green-600/60 bg-green-700/60 px-4 py-1.5 font-eyebrow text-xs font-semibold uppercase tracking-widest text-green-500">
            Admin-Bereich
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900/80 backdrop-blur-sm">
          <div className="p-8">
            <LoginForm
              portal="admin"
              variant="dark"
              invalidCredentialsMessage="Ungültige Anmeldedaten oder fehlende Berechtigung."
              successToast="Admin-Anmeldung erfolgreich."
              onSuccess={() => {
                // Return to the originally requested page when the middleware
                // (#68) forwarded one via ?redirect=, else the admin home (#121).
                window.location.href = readRedirectTarget(window.location.search, "/admin/users")
              }}
              emailPlaceholder="admin@elysion.de"
              submitLabel="ANMELDEN"
              submitPendingLabel="ANMELDUNG…"
              loginHeader={
                <>
                  <h1 className="mb-1 font-heading text-lg font-bold tracking-wide text-sand-page">
                    Administrator-Anmeldung
                  </h1>
                  <p className="mb-6 text-sm text-sand-page/70">
                    Nur für autorisierte Administratoren.
                  </p>
                </>
              }
              forgot={{
                intro: "Wir senden einen Reset-Link an Ihre Admin-E-Mail.",
                successMessage: "Falls ein Admin-Konto existiert, wurde ein Reset-Link gesendet.",
                submitLabel: "LINK SENDEN",
                placeholder: "admin@elysion.de",
              }}
            />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-sand-page/60">
          <a href={buyerUrl("/")} className="transition-colors hover:text-sand-page">
            ← Zurück zum Shop
          </a>
        </p>
      </div>
    </div>
  )
}
