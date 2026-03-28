"use client"

import type React from "react"
import { useState } from "react"
import { X, Eye, EyeOff, Mail, Lock, User, Building2, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import type { UserRole } from "@/src/types"
import { validatePassword, isValidEmail } from "@/src/lib/validation"
import { toast } from "sonner"

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
  const [regRole, setRegRole] = useState<UserRole>("BUYER")
  const [regCompanyName, setRegCompanyName] = useState("")
  const [regVatId, setRegVatId] = useState("")
  const [regIban, setRegIban] = useState("")

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
    setRegRole("BUYER")
    setRegCompanyName("")
    setRegVatId("")
    setRegIban("")
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
      await login({ email: loginEmail, password: loginPassword })
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

    if (regRole === "SELLER" && (!regCompanyName || !regVatId || !regIban)) {
      setError("Bitte füllen Sie alle Verkäufer-Felder aus.")
      return
    }

    try {
      const dto =
        regRole === "SELLER"
          ? {
              email: regEmail,
              password: regPassword,
              firstName: regFirstName,
              lastName: regLastName,
              role: "SELLER" as const,
              companyName: regCompanyName,
              vatId: regVatId,
              iban: regIban,
            }
          : {
              email: regEmail,
              password: regPassword,
              firstName: regFirstName,
              lastName: regLastName,
              role: "BUYER" as const,
            }

      await register(dto)
      toast.success("Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Verifizierung.")
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
    // Simulate API call
    await new Promise((r) => setTimeout(r, 600))
    setForgotSubmitted(true)
  }

  const pwValidation = validatePassword(regPassword)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={() => { resetAll(); onClose() }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Schliessen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── LOGIN VIEW ──────────────────────────────────────────── */}
        {view === "login" && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Willkommen zurück</h2>
            </div>
            <p className="text-slate-600 mb-6">Melden Sie sich an, um fortzufahren.</p>

            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                    placeholder="ihre@email.de"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-pw" className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    id="login-pw"
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                    placeholder="Passwort"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button type="button" onClick={() => switchView("forgot")} className="text-sm text-teal-600 hover:text-teal-800">
                  Passwort vergessen?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Anmeldung...</> : "Anmelden"}
              </button>
            </form>

            <p className="text-center mt-4 text-slate-600 text-sm">
              {"Noch kein Konto? "}
              <button onClick={() => switchView("register")} className="text-teal-600 hover:text-teal-800 font-medium">
                Registrieren
              </button>
            </p>
          </div>
        )}

        {/* ── REGISTER VIEW ───────────────────────────────────────── */}
        {view === "register" && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Konto erstellen</h2>
            </div>
            <p className="text-slate-600 mb-6">Starten Sie Ihre nachhaltige Reise.</p>

            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kontotyp</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegRole("BUYER")}
                    className={`p-3 border-2 rounded-lg text-center transition-colors ${regRole === "BUYER" ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    <User className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Käufer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole("SELLER")}
                    className={`p-3 border-2 rounded-lg text-center transition-colors ${regRole === "SELLER" ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    <Building2 className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Verkäufer</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-fn" className="block text-sm font-medium text-slate-700 mb-1">Vorname</label>
                  <input id="reg-fn" type="text" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800" />
                </div>
                <div>
                  <label htmlFor="reg-ln" className="block text-sm font-medium text-slate-700 mb-1">Nachname</label>
                  <input id="reg-ln" type="text" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800" />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800" placeholder="ihre@email.de" />
                </div>
              </div>

              <div>
                <label htmlFor="reg-pw" className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input id="reg-pw" type={showPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Inline password validation */}
                {regPassword.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {pwValidation.results.map((r) => (
                      <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.passed ? "text-emerald-600" : "text-slate-500"}`}>
                        {r.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label htmlFor="reg-cpw" className="block text-sm font-medium text-slate-700 mb-1">Passwort bestätigen</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input id="reg-cpw" type={showPassword ? "text" : "password"} value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800" />
                </div>
                {regConfirmPassword.length > 0 && regPassword !== regConfirmPassword && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Passwörter stimmen nicht überein</p>
                )}
              </div>

              {regRole === "SELLER" && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-slate-700">Unternehmensdaten</p>
                  <div>
                    <label htmlFor="reg-company" className="block text-sm text-slate-600 mb-1">Firmenname</label>
                    <input id="reg-company" type="text" value={regCompanyName} onChange={(e) => setRegCompanyName(e.target.value)} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800" />
                  </div>
                  <div>
                    <label htmlFor="reg-vat" className="block text-sm text-slate-600 mb-1">USt-IdNr.</label>
                    <input id="reg-vat" type="text" value={regVatId} onChange={(e) => setRegVatId(e.target.value)} required placeholder="DE123456789" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800" />
                  </div>
                  <div>
                    <label htmlFor="reg-iban" className="block text-sm text-slate-600 mb-1">IBAN</label>
                    <input id="reg-iban" type="text" value={regIban} onChange={(e) => setRegIban(e.target.value)} required placeholder="DE89 3704 0044 0532 0130 00" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrierung...</> : "Konto erstellen"}
              </button>
            </form>

            <p className="text-center mt-4 text-slate-600 text-sm">
              {"Bereits ein Konto? "}
              <button onClick={() => switchView("login")} className="text-teal-600 hover:text-teal-800 font-medium">
                Anmelden
              </button>
            </p>
          </div>
        )}

        {/* ── FORGOT PASSWORD VIEW ────────────────────────────────── */}
        {view === "forgot" && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Passwort vergessen</h2>
            </div>

            {!forgotSubmitted ? (
              <>
                <p className="text-slate-600 mb-6">
                  Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
                </p>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800" placeholder="ihre@email.de" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors">
                    Link senden
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-700">
                  Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <button onClick={() => switchView("login")} className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                Zurück zur Anmeldung
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
