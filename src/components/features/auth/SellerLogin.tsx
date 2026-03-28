"use client"

import React, { useState } from "react"
import { Eye, EyeOff, Mail, Lock, Building2, Leaf, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { AuthService } from "@/src/services/auth.service"
import { validatePassword, isValidEmail } from "@/src/lib/validation"
import { toast } from "sonner"

type View = "login" | "register" | "forgot"

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
    setRegEmail(""); setRegPassword(""); setRegConfirm("")
    setRegFirstName(""); setRegLastName(""); setRegCompany(""); setRegVatId(""); setRegIban("")
    setForgotEmail(""); setForgotDone(false)
    setShowPassword(false)
  }

  const switchView = (v: View) => { reset(); setView(v) }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const result = await login({ email, password })
      // Verify role after login
      if ((result as unknown as { role?: string })?.role === "BUYER") {
        setError("Dieses Konto ist kein Verkäuferkonto. Bitte verwenden Sie die normale Anmeldung.")
        return
      }
      toast.success("Erfolgreich angemeldet!")
      window.location.href = "/seller-dashboard"
    } catch {
      setError("Ungültige Anmeldedaten.")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!isValidEmail(regEmail)) { setError("Ungültige E-Mail-Adresse."); return }
    if (!validatePassword(regPassword).valid) { setError("Das Passwort erfüllt nicht alle Anforderungen."); return }
    if (regPassword !== regConfirm) { setError("Passwörter stimmen nicht überein."); return }
    if (!regCompany || !regVatId || !regIban) { setError("Bitte alle Pflichtfelder ausfüllen."); return }
    try {
      await register({
        email: regEmail, password: regPassword,
        firstName: regFirstName, lastName: regLastName,
        role: "SELLER", companyName: regCompany, vatId: regVatId, iban: regIban,
      })
      toast.success("Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails.")
      switchView("login")
    } catch {
      setError("Registrierung fehlgeschlagen. E-Mail bereits vergeben?")
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await AuthService.forgotPassword(forgotEmail) } catch { /* silent */ }
    setForgotDone(true)
  }

  const pwCheck = validatePassword(regPassword)

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <Leaf className="w-8 h-8 text-teal-600" />
            <span className="text-2xl font-bold text-slate-800">Elysion</span>
          </a>
          <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-1.5 rounded-full text-sm font-medium">
            <Building2 className="w-4 h-4" />
            Verkäufer-Portal
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* ── LOGIN ── */}
          {view === "login" && (
            <div className="p-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Verkäufer-Anmeldung</h1>
              <p className="text-slate-500 text-sm mb-6">Melden Sie sich in Ihrem Verkäufer-Konto an.</p>

              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="ihre@firma.de" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Passwort" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => switchView("forgot")} className="text-sm text-teal-600 hover:text-teal-800">
                    Passwort vergessen?
                  </button>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Anmeldung...</> : "Anmelden"}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Noch kein Verkäufer-Konto?{" "}
                <button onClick={() => switchView("register")} className="text-teal-600 hover:text-teal-800 font-medium">Registrieren</button>
              </p>
            </div>
          )}

          {/* ── REGISTER ── */}
          {view === "register" && (
            <div className="p-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Als Verkäufer registrieren</h1>
              <p className="text-slate-500 text-sm mb-6">Verkaufen Sie Ihre nachhaltigen Produkte auf Elysion.</p>

              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vorname</label>
                    <input type="text" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nachname</label>
                    <input type="text" value={regLastName} onChange={e => setRegLastName(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="ihre@firma.de" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passwort *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPassword ? "text" : "password"} value={regPassword} onChange={e => setRegPassword(e.target.value)} required
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {regPassword.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {pwCheck.results.map(r => (
                        <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.passed ? "text-emerald-600" : "text-slate-500"}`}>
                          {r.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />} {r.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passwort bestätigen *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPassword ? "text" : "password"} value={regConfirm} onChange={e => setRegConfirm(e.target.value)} required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  {regConfirm.length > 0 && regPassword !== regConfirm && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Stimmt nicht überein</p>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Unternehmensdaten</p>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Firmenname *</label>
                    <input type="text" value={regCompany} onChange={e => setRegCompany(e.target.value)} required
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">USt-IdNr. *</label>
                    <input type="text" value={regVatId} onChange={e => setRegVatId(e.target.value)} required placeholder="DE123456789"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">IBAN *</label>
                    <input type="text" value={regIban} onChange={e => setRegIban(e.target.value)} required placeholder="DE89 3704 0044 …"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white" />
                  </div>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrierung...</> : "Verkäufer-Konto erstellen"}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Bereits registriert?{" "}
                <button onClick={() => switchView("login")} className="text-teal-600 hover:text-teal-800 font-medium">Anmelden</button>
              </p>
            </div>
          )}

          {/* ── FORGOT ── */}
          {view === "forgot" && (
            <div className="p-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Passwort zurücksetzen</h1>
              {!forgotDone ? (
                <>
                  <p className="text-slate-500 text-sm mb-6">Wir senden Ihnen einen Reset-Link.</p>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="ihre@firma.de" />
                    </div>
                    <button type="submit" className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-semibold hover:bg-teal-700 transition-colors">
                      Link senden
                    </button>
                  </form>
                </>
              ) : (
                <div className="mt-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">Falls ein Konto existiert, haben wir einen Reset-Link gesendet.</p>
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

        <p className="text-center text-xs text-slate-400 mt-6">
          <a href="/" className="hover:text-slate-600">← Zurück zum Shop</a>
        </p>
      </div>
    </div>
  )
}
