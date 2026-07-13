"use client"

import { useState } from "react"
import { Leaf, ShieldCheck, BarChart3, Award, Banknote } from "lucide-react"
import { buyerUrl } from "@/src/lib/seller-url"
import { LoginForm } from "@/src/components/features/auth/_shared/LoginForm"
import { SellerRegisterForm } from "@/src/components/features/auth/SellerRegisterForm"

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
      <div className="relative hidden overflow-hidden bg-stone-900 lg:flex lg:w-5/12 lg:flex-col lg:px-12 lg:py-16 xl:w-2/5">
        <div
          aria-hidden="true"
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sage-700/20"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-sage-600/10"
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">Elysion</span>
            <p className="text-xs font-medium uppercase tracking-widest text-sage-400">
              Verkäufer-Portal
            </p>
          </div>
        </div>

        <div className="relative mt-16">
          <h2 className="text-3xl font-bold leading-snug text-white">
            Ihr nachhaltiges Geschäft — <span className="text-sage-400">zentral verwaltet.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-500">
            Produkte, Bestellungen, Zertifikate und Auszahlungen — alles an einem Ort.
          </p>
        </div>

        <ul className="relative mt-10 space-y-5">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sage-700/40">
                <Icon className="h-4 w-4 text-sage-400" />
              </div>
              <span className="text-sm text-stone-300">{text}</span>
            </li>
          ))}
        </ul>

        <p className="relative mt-auto pt-16 text-xs text-stone-600">
          Elysion Marketplace · Nachhaltiger Handel
        </p>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-white px-6 py-12">
        <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900">
            <Leaf className="h-6 w-6 text-sage-400" />
          </div>
          <span className="text-xl font-bold text-stone-800">Elysion</span>
          <span className="text-xs font-medium uppercase tracking-widest text-sage-600">
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
                window.location.href = "/seller-dashboard"
              }}
              emailPlaceholder="ihre@firma.de"
              errorClassName="mb-5"
              loginHeader={
                <>
                  <h1 className="mb-1 text-2xl font-bold text-stone-800">Willkommen zurück</h1>
                  <p className="mb-8 text-sm text-stone-500">
                    Melden Sie sich in Ihrem Verkäufer-Konto an.
                  </p>
                </>
              }
              loginFooter={
                <p className="mt-8 text-center text-sm text-stone-500">
                  Noch kein Verkäufer-Konto?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="font-semibold text-sage-600 hover:text-sage-800"
                  >
                    Registrieren
                  </button>
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

        <p className="mt-10 text-xs text-stone-500">
          <a href={buyerUrl("/")} className="hover:text-stone-600">
            ← Zurück zum Shop
          </a>
        </p>
      </div>
    </div>
  )
}
