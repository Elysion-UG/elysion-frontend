"use client"

import React, { useState } from "react"
import { Leaf, CheckCircle2, XCircle, ShieldCheck, BarChart3, Award, Banknote } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { validatePassword, isValidEmail } from "@/src/lib/validation"
import { ApiError } from "@/src/lib/api-client"
import { toast } from "sonner"
import { buyerUrl } from "@/src/lib/seller-url"
import { ErrorAlert } from "@/src/components/shared"
import { PasswordField } from "@/src/components/features/auth/_shared/PasswordField"
import { EmailField } from "@/src/components/features/auth/_shared/EmailField"
import { AuthSubmitButton } from "@/src/components/features/auth/_shared/AuthSubmitButton"
import { ForgotPasswordPanel } from "@/src/components/features/auth/_shared/ForgotPasswordPanel"

type View = "login" | "register" | "forgot"

const FEATURES = [
  { icon: ShieldCheck, text: "Zertifizierungsprüfung & Nachhaltigkeitsnachweis" },
  { icon: BarChart3, text: "Echtzeit-Übersicht über Bestellungen und Umsatz" },
  { icon: Award, text: "Produktverwaltung mit Status-Tracking" },
  { icon: Banknote, text: "Transparente Auszahlungen und Abrechnungen" },
]

const textInputClass =
  "w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"

export default function SellerLogin() {
  const { login, register, isLoading } = useAuth()
  const [view, setView] = useState<View>("login")
  const [error, setError] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm] = useState("")
  const [regFirstName, setRegFirstName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [regCompany, setRegCompany] = useState("")
  const [regVatId, setRegVatId] = useState("")
  const [regIban, setRegIban] = useState("")

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
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError(err.message)
      } else {
        setError("Ungültige Anmeldedaten.")
      }
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

  const pwCheck = validatePassword(regPassword)

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
          <p className="mt-4 text-sm leading-relaxed text-stone-400">
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
          {view === "login" && (
            <>
              <h1 className="mb-1 text-2xl font-bold text-stone-800">Willkommen zurück</h1>
              <p className="mb-8 text-sm text-stone-500">
                Melden Sie sich in Ihrem Verkäufer-Konto an.
              </p>

              {error && <ErrorAlert message={error} className="mb-5" />}

              <form onSubmit={handleLogin} className="space-y-4">
                <EmailField
                  label="E-Mail"
                  value={email}
                  onChange={setEmail}
                  placeholder="ihre@firma.de"
                  required
                />
                <PasswordField
                  label="Passwort"
                  value={password}
                  onChange={setPassword}
                  placeholder="Passwort"
                  required
                />
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchView("forgot")}
                    className="text-sm text-sage-600 hover:text-sage-800"
                  >
                    Passwort vergessen?
                  </button>
                </div>
                <AuthSubmitButton
                  label="Anmelden"
                  pendingLabel="Anmeldung..."
                  isLoading={isLoading}
                />
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
                      className={textInputClass}
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
                      className={textInputClass}
                    />
                  </div>
                </div>

                <EmailField
                  label="E-Mail *"
                  value={regEmail}
                  onChange={setRegEmail}
                  placeholder="ihre@firma.de"
                  required
                />

                <div>
                  <PasswordField
                    label="Passwort *"
                    value={regPassword}
                    onChange={setRegPassword}
                    required
                    autoComplete="new-password"
                  />
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
                  <PasswordField
                    label="Passwort bestätigen *"
                    value={regConfirm}
                    onChange={setRegConfirm}
                    required
                    autoComplete="new-password"
                  />
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

                <AuthSubmitButton
                  label="Verkäufer-Konto erstellen"
                  pendingLabel="Registrierung..."
                  isLoading={isLoading}
                />
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

          {view === "forgot" && (
            <ForgotPasswordPanel
              intro="Wir senden Ihnen einen Reset-Link an Ihre E-Mail-Adresse."
              successMessage="Falls ein Konto existiert, haben wir einen Reset-Link gesendet."
              backLabel="← Zurück zur Anmeldung"
              placeholder="ihre@firma.de"
              onBack={() => switchView("login")}
            />
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
