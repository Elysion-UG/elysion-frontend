"use client"

import React, { useState } from "react"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Leaf,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  BarChart3,
  Award,
  Banknote,
} from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { AuthService } from "@/src/services/auth.service"
import { validatePassword, isValidEmail } from "@/src/lib/validation"
import { toast } from "sonner"
import { buyerUrl } from "@/src/lib/seller-url"
import { ErrorAlert } from "@/src/components/shared"

type View = "login" | "register" | "forgot"

const FEATURES = [
  { icon: ShieldCheck, text: "Zertifizierungsprüfung & Nachhaltigkeitsnachweis" },
  { icon: BarChart3, text: "Echtzeit-Übersicht über Bestellungen und Umsatz" },
  { icon: Award, text: "Produktverwaltung mit Status-Tracking" },
  { icon: Banknote, text: "Transparente Auszahlungen und Abrechnungen" },
]

export default function SellerLogin() {
  const { login, register, isLoading } = useAuth()
  const [view, setView] = useState<View>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  // Login
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Register
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm] = useState("")
  const [regFirstName, setRegFirstName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [regCompany, setRegCompany] = useState("")
  const [regVatId, setRegVatId] = useState("")
  const [regIban, setRegIban] = useState("")

  // Forgot
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotDone, setForgotDone] = useState(false)

  const reset = () => {
    setError("")
    setEmail("")
    setPassword("")
    setRegEmail("")
    setRegPassword("")
    setRegConfirm("")
    setRegFirstName("")
    setRegLastName("")
    setRegCompany("")
    setRegVatId("")
    setRegIban("")
    setForgotEmail("")
    setForgotDone(false)
    setShowPassword(false)
  }

  const switchView = (v: View) => {
    reset()
    setView(v)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await login({ email, password }, "seller")
      toast.success("Erfolgreich angemeldet!")
      window.location.href = "/seller-dashboard"
    } catch {
      setError("Ungültige Anmeldedaten.")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!isValidEmail(regEmail)) {
      setError("Ungültige E-Mail-Adresse.")
      return
    }
    if (!validatePassword(regPassword).valid) {
      setError("Das Passwort erfüllt nicht alle Anforderungen.")
      return
    }
    if (regPassword !== regConfirm) {
      setError("Passwörter stimmen nicht überein.")
      return
    }
    if (!regCompany || !regVatId || !regIban) {
      setError("Bitte alle Pflichtfelder ausfüllen.")
      return
    }
    try {
      await register({
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        role: "SELLER",
        companyName: regCompany,
        vatId: regVatId,
        iban: regIban,
      })
      toast.success("Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails.")
      switchView("login")
    } catch {
      setError("Registrierung fehlgeschlagen. E-Mail bereits vergeben?")
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await AuthService.forgotPassword(forgotEmail)
    } catch {
      /* silent */
    }
    setForgotDone(true)
  }

  const pwCheck = validatePassword(regPassword)

  return (
    <div className="flex min-h-screen">
      {/* ── LEFT PANEL (desktop only) ── */}
      <div className="relative hidden overflow-hidden bg-stone-900 lg:flex lg:w-5/12 lg:flex-col lg:px-12 lg:py-16 xl:w-2/5">
        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sage-700/20"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-sage-600/10"
        />

        {/* Logo */}
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

        {/* Headline */}
        <div className="relative mt-16">
          <h2 className="text-3xl font-bold leading-snug text-white">
            Ihr nachhaltiges Geschäft — <span className="text-sage-400">zentral verwaltet.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-400">
            Produkte, Bestellungen, Zertifikate und Auszahlungen — alles an einem Ort.
          </p>
        </div>

        {/* Feature list */}
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

        {/* Bottom note */}
        <p className="relative mt-auto pt-16 text-xs text-stone-600">
          Elysion Marketplace · Nachhaltiger Handel
        </p>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-white px-6 py-12">
        {/* Mobile logo */}
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
          {/* ── LOGIN ── */}
          {view === "login" && (
            <>
              <h1 className="mb-1 text-2xl font-bold text-stone-800">Willkommen zurück</h1>
              <p className="mb-8 text-sm text-stone-500">
                Melden Sie sich in Ihrem Verkäufer-Konto an.
              </p>

              {error && <ErrorAlert message={error} className="mb-5" />}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                      placeholder="ihre@firma.de"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Passwort
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-10 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                      placeholder="Passwort"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchView("forgot")}
                    className="text-sm text-sage-600 hover:text-sage-800"
                  >
                    Passwort vergessen?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Anmeldung...
                    </>
                  ) : (
                    "Anmelden"
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-stone-500">
                Noch kein Verkäufer-Konto?{" "}
                <button
                  onClick={() => switchView("register")}
                  className="font-semibold text-sage-600 hover:text-sage-800"
                >
                  Registrieren
                </button>
              </p>
            </>
          )}

          {/* ── REGISTER ── */}
          {view === "register" && (
            <>
              <h1 className="mb-1 text-2xl font-bold text-stone-800">Als Verkäufer registrieren</h1>
              <p className="mb-8 text-sm text-stone-500">
                Verkaufen Sie Ihre nachhaltigen Produkte auf Elysion.
              </p>

              {error && <ErrorAlert message={error} className="mb-5" />}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Vorname
                    </label>
                    <input
                      type="text"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Nachname
                    </label>
                    <input
                      type="text"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    E-Mail *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                      placeholder="ihre@firma.de"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Passwort *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-10 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {regPassword.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {pwCheck.results.map((r) => (
                        <li
                          key={r.label}
                          className={`flex items-center gap-1.5 text-xs ${r.passed ? "text-emerald-600" : "text-stone-400"}`}
                        >
                          {r.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}{" "}
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">
                    Passwort bestätigen *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    />
                  </div>
                  {regConfirm.length > 0 && regPassword !== regConfirm && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <XCircle className="h-3.5 w-3.5" /> Stimmt nicht überein
                    </p>
                  )}
                </div>

                <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Unternehmensdaten
                  </p>
                  <div>
                    <label className="mb-1 block text-sm text-stone-600">Firmenname *</label>
                    <input
                      type="text"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      required
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-stone-600">USt-IdNr. *</label>
                    <input
                      type="text"
                      value={regVatId}
                      onChange={(e) => setRegVatId(e.target.value)}
                      required
                      placeholder="DE123456789"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-stone-600">IBAN *</label>
                    <input
                      type="text"
                      value={regIban}
                      onChange={(e) => setRegIban(e.target.value)}
                      required
                      placeholder="DE89 3704 0044 …"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Registrierung...
                    </>
                  ) : (
                    "Verkäufer-Konto erstellen"
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-stone-500">
                Bereits registriert?{" "}
                <button
                  onClick={() => switchView("login")}
                  className="font-semibold text-sage-600 hover:text-sage-800"
                >
                  Anmelden
                </button>
              </p>
            </>
          )}

          {/* ── FORGOT ── */}
          {view === "forgot" && (
            <>
              <h1 className="mb-1 text-2xl font-bold text-stone-800">Passwort zurücksetzen</h1>
              {!forgotDone ? (
                <>
                  <p className="mb-8 text-sm text-stone-500">
                    Wir senden Ihnen einen Reset-Link an Ihre E-Mail-Adresse.
                  </p>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                        placeholder="ihre@firma.de"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-sage-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-700"
                    >
                      Link senden
                    </button>
                  </form>
                </>
              ) : (
                <div className="mt-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  </div>
                  <p className="text-sm text-stone-600">
                    Falls ein Konto existiert, haben wir einen Reset-Link gesendet.
                  </p>
                </div>
              )}
              <div className="mt-8 text-center">
                <button
                  onClick={() => switchView("login")}
                  className="text-sm font-semibold text-sage-600 hover:text-sage-800"
                >
                  ← Zurück zur Anmeldung
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-10 text-xs text-stone-400">
          <a href={buyerUrl("/")} className="hover:text-stone-600">
            ← Zurück zum Shop
          </a>
        </p>
      </div>
    </div>
  )
}
