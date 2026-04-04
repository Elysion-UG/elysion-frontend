"use client"

import type React from "react"
import { useState } from "react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import {
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { validatePassword, isValidEmail } from "@/src/lib/validation"
import { sellerUrl } from "@/src/lib/seller-url"
import { toast } from "sonner"
import { ErrorAlert } from "@/src/components/shared"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

type ModalView = "login" | "register" | "forgot"

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, register, isLoading } = useAuth()
  const [view, setView] = useState<ModalView>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirmPassword, setRegConfirmPassword] = useState("")
  const [regFirstName, setRegFirstName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSubmitted, setForgotSubmitted] = useState(false)

  const resetAll = () => {
    setError("")
    setLoginEmail("")
    setLoginPassword("")
    setRegEmail("")
    setRegPassword("")
    setRegConfirmPassword("")
    setRegFirstName("")
    setRegLastName("")
    setPrivacyAccepted(false)
    setForgotEmail("")
    setForgotSubmitted(false)
    setShowPassword(false)
  }

  const switchView = (v: ModalView) => {
    resetAll()
    setView(v)
  }

  // ── Login Handler ──────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await login({ email: loginEmail, password: loginPassword }, "customer")
      toast.success("Erfolgreich angemeldet!")
      resetAll()
      onClose()
    } catch {
      setError("Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.")
    }
  }

  // ── Register Handler ───────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isValidEmail(regEmail)) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.")
      return
    }

    const { valid } = validatePassword(regPassword)
    if (!valid) {
      setError("Das Passwort erfüllt nicht alle Anforderungen.")
      return
    }

    if (regPassword !== regConfirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    try {
      const dto = {
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        role: "BUYER" as const,
      }

      await register(dto)
      toast.success(
        "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Verifizierung."
      )
      resetAll()
      onClose()
    } catch {
      setError("Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.")
    }
  }

  // ── Forgot Password Handler ────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    await new Promise((r) => setTimeout(r, 600))
    setForgotSubmitted(true)
  }

  const pwValidation = validatePassword(regPassword)
  const modalRef = useFocusTrap(() => {
    resetAll()
    onClose()
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          view === "login"
            ? "Anmelden"
            : view === "register"
              ? "Konto erstellen"
              : "Passwort vergessen"
        }
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={() => {
            resetAll()
            onClose()
          }}
          className="absolute right-4 top-4 text-stone-400 transition-colors hover:text-stone-600"
          aria-label="Schliessen"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ── LOGIN VIEW ──────────────────────────────────────────── */}
        {view === "login" && (
          <div className="p-6">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600">
                <User className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">Willkommen zurück</h2>
            </div>
            <p className="mb-6 text-stone-500">Melden Sie sich an, um fortzufahren.</p>

            {error && <ErrorAlert message={error} className="mb-4" />}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1 block text-sm font-medium text-stone-700"
                >
                  E-Mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    placeholder="ihre@email.de"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-pw" className="mb-1 block text-sm font-medium text-stone-700">
                  Passwort
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="login-pw"
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-10 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    placeholder="Passwort"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-2.5 font-semibold text-white transition-colors hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-50"
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

            <p className="mt-4 text-center text-sm text-stone-500">
              {"Noch kein Konto? "}
              <button
                onClick={() => switchView("register")}
                className="font-semibold text-sage-600 hover:text-sage-800"
              >
                Registrieren
              </button>
            </p>
          </div>
        )}

        {/* ── REGISTER VIEW ───────────────────────────────────────── */}
        {view === "register" && (
          <div className="p-6">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600">
                <User className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">Konto erstellen</h2>
            </div>
            <p className="mb-6 text-stone-500">Starten Sie Ihre nachhaltige Reise.</p>

            {error && <ErrorAlert message={error} className="mb-4" />}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Kontotyp</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="rounded-xl border-2 border-sage-600 bg-sage-50 p-3 text-center text-sage-700"
                  >
                    <User className="mx-auto mb-1 h-5 w-5" />
                    <span className="text-sm font-semibold">Käufer</span>
                  </button>
                  <a
                    href={sellerUrl("/login/seller")}
                    className="rounded-xl border-2 border-stone-200 p-3 text-center text-stone-500 transition-colors hover:border-sage-300 hover:text-sage-600"
                    onClick={() => {
                      resetAll()
                      onClose()
                    }}
                  >
                    <Building2 className="mx-auto mb-1 h-5 w-5" />
                    <span className="text-sm font-semibold">Verkäufer</span>
                    <span className="mt-0.5 block text-[10px] text-stone-400">→ Seller Portal</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-fn" className="mb-1 block text-sm font-medium text-stone-700">
                    Vorname
                  </label>
                  <input
                    id="reg-fn"
                    type="text"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="reg-ln" className="mb-1 block text-sm font-medium text-stone-700">
                    Nachname
                  </label>
                  <input
                    id="reg-ln"
                    type="text"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="mb-1 block text-sm font-medium text-stone-700"
                >
                  E-Mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                    placeholder="ihre@email.de"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-pw" className="mb-1 block text-sm font-medium text-stone-700">
                  Passwort
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="reg-pw"
                    type={showPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-10 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {regPassword.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {pwValidation.results.map((r) => (
                      <li
                        key={r.label}
                        className={`flex items-center gap-1.5 text-xs ${r.passed ? "text-emerald-600" : "text-stone-400"}`}
                      >
                        {r.passed ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label htmlFor="reg-cpw" className="mb-1 block text-sm font-medium text-stone-700">
                  Passwort bestätigen
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="reg-cpw"
                    type={showPassword ? "text" : "password"}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  />
                </div>
                {regConfirmPassword.length > 0 && regPassword !== regConfirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3.5 w-3.5" /> Passwörter stimmen nicht überein
                  </p>
                )}
              </div>

              {/* DSGVO Art. 7: Datenschutz-Einwilligung */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 accent-sage-600"
                  />
                  <span className="text-xs text-stone-600">
                    Ich habe die{" "}
                    <a
                      href="/datenschutz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sage-600 underline hover:text-sage-800"
                    >
                      Datenschutzerklärung
                    </a>{" "}
                    gelesen und stimme der Verarbeitung meiner Daten zu. *
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !privacyAccepted}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-2.5 font-semibold text-white transition-colors hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Registrierung...
                  </>
                ) : (
                  "Konto erstellen"
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-stone-500">
              {"Bereits ein Konto? "}
              <button
                onClick={() => switchView("login")}
                className="font-semibold text-sage-600 hover:text-sage-800"
              >
                Anmelden
              </button>
            </p>
          </div>
        )}

        {/* ── FORGOT PASSWORD VIEW ────────────────────────────────── */}
        {view === "forgot" && (
          <div className="p-6">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">Passwort vergessen</h2>
            </div>

            {!forgotSubmitted ? (
              <>
                <p className="mb-6 text-stone-500">
                  Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum
                  Zurücksetzen.
                </p>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="mb-1 block text-sm font-medium text-stone-700"
                    >
                      E-Mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                        placeholder="ihre@email.de"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-sage-600 py-2.5 font-semibold text-white transition-colors hover:bg-sage-700"
                  >
                    Link senden
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <p className="text-stone-600">
                  Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Link zum
                  Zurücksetzen des Passworts gesendet.
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => switchView("login")}
                className="text-sm font-semibold text-sage-600 hover:text-sage-800"
              >
                Zurück zur Anmeldung
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
