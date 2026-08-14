"use client"

import { useState } from "react"
import { ShieldCheck, BarChart3, Award, Banknote } from "lucide-react"
import { buyerUrl } from "@/src/lib/seller-url"
import { readRedirectTarget } from "@/src/lib/auth/redirect-param"
import { Button } from "@/src/components/ui/button"
import { LoginForm } from "@/src/components/features/auth/_shared/LoginForm"
import { SellerRegisterForm } from "@/src/components/features/auth/SellerRegisterForm"
import { BrandLogo } from "@/src/components/shared/BrandLogo"

type Mode = "login" | "register"

const FEATURES = [
  { icon: ShieldCheck, text: "Zertifizierungsprüfung & Nachhaltigkeitsnachweis" },
  { icon: BarChart3, text: "Echtzeit-Übersicht über Bestellungen und Umsatz" },
  { icon: Award, text: "Produktverwaltung mit Status-Tracking" },
  { icon: Banknote, text: "Transparente Auszahlungen und Abrechnungen" },
]

export default function SellerLogin() {
  const [mode, setMode] = useState<Mode>("login")

  return (
    <div className="flex min-h-screen">
      {/* ── LEFT PANEL (desktop only) ── */}
      <div className="relative hidden overflow-hidden bg-ink-900 lg:flex lg:w-5/12 lg:flex-col lg:px-12 lg:py-16 xl:w-2/5">
        <div
          aria-hidden="true"
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-700/20"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-green-500/10"
        />

        <div className="relative flex items-center gap-3">
          <BrandLogo variant="mark" inverted markSize={30} />
          <div>
            <span className="font-heading text-xl font-semibold tracking-[0.18em] text-sand-page">
              ELYSION
            </span>
            <p className="font-eyebrow text-xs font-semibold uppercase tracking-widest text-green-500">
              Verkäufer-Portal
            </p>
          </div>
        </div>

        <div className="relative mt-16">
          <h2 className="text-3xl font-bold leading-snug text-sand-page">
            Ihr nachhaltiges Geschäft — <span className="text-green-500">zentral verwaltet.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sand-page/70">
            Produkte, Bestellungen, Zertifikate und Auszahlungen — alles an einem Ort.
          </p>
        </div>

        <ul className="relative mt-10 space-y-5">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-700/40">
                <Icon className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-sm text-sand-page/70">{text}</span>
            </li>
          ))}
        </ul>

        <p className="relative mt-auto pt-16 text-xs text-sand-page/50">
          Elysion Marketplace · Nachhaltiger Handel
        </p>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-white px-6 py-12">
        <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
          <BrandLogo variant="mark" markSize={32} />
          <span className="font-heading text-xl font-semibold tracking-[0.18em] text-foreground">
            ELYSION
          </span>
          <span className="font-eyebrow text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Verkäufer-Portal
          </span>
        </div>

        <div className="w-full max-w-md">
          {mode === "login" ? (
            <LoginForm
              portal="seller"
              invalidCredentialsMessage="Ungültige Anmeldedaten."
              successToast="Erfolgreich angemeldet!"
              onSuccess={() => {
                // Return to the originally requested page when the middleware
                // (#68) forwarded one via ?redirect=, else the dashboard (#121).
                window.location.href = readRedirectTarget(
                  window.location.search,
                  "/seller-dashboard"
                )
              }}
              emailPlaceholder="ihre@firma.de"
              errorClassName="mb-5"
              loginHeader={
                <>
                  <h1 className="mb-1 text-2xl font-bold text-foreground">Willkommen zurück</h1>
                  <p className="mb-8 text-sm text-muted-foreground">
                    Melden Sie sich in Ihrem Verkäufer-Konto an.
                  </p>
                </>
              }
              loginFooter={
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Noch kein Verkäufer-Konto?{" "}
                  <Button
                    variant="link"
                    onClick={() => setMode("register")}
                    className="h-auto p-0 text-green-600"
                  >
                    Registrieren
                  </Button>
                </p>
              }
              forgot={{
                intro: "Wir senden Ihnen einen Reset-Link an Ihre E-Mail-Adresse.",
                successMessage: "Falls ein Konto existiert, haben wir einen Reset-Link gesendet.",
                backLabel: "← Zurück zur Anmeldung",
                placeholder: "ihre@firma.de",
              }}
            />
          ) : (
            <SellerRegisterForm
              onLoginClick={() => setMode("login")}
              onRegistered={() => setMode("login")}
            />
          )}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          <a href={buyerUrl("/")} className="hover:text-foreground">
            ← Zurück zum Shop
          </a>
        </p>
      </div>
    </div>
  )
}
