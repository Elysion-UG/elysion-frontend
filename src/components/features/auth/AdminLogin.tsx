"use client"

import { ShieldCheck } from "lucide-react"
import { buyerUrl } from "@/src/lib/seller-url"
import { readRedirectTarget } from "@/src/lib/auth/redirect-param"
import { LoginForm } from "@/src/components/features/auth/_shared/LoginForm"

export default function AdminLogin() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4"
      style={{
        backgroundImage:
          "linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Subtle glow orb */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyber-500/5 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <a href={buyerUrl("/")} className="mb-5 inline-flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyber-600/20 shadow-[0_0_20px_rgba(6,182,212,0.2)] ring-1 ring-cyber-500/40">
              <ShieldCheck className="h-6 w-6 text-cyber-400" />
            </div>
            <span className="font-mono text-lg font-bold tracking-widest text-white">ELYSION</span>
          </a>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyber-800/60 bg-cyber-950/60 px-4 py-1.5 font-mono text-xs font-medium tracking-widest text-cyber-400">
            ADMIN-BEREICH
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/80 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-sm">
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
                  <h1 className="mb-1 font-mono text-lg font-bold tracking-wider text-slate-100">
                    Administrator-Anmeldung
                  </h1>
                  <p className="mb-6 text-sm text-slate-500">
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

        <p className="mt-6 text-center text-xs text-slate-700">
          <a href={buyerUrl("/")} className="transition-colors hover:text-slate-400">
            ← Zurück zum Shop
          </a>
        </p>
      </div>
    </div>
  )
}
