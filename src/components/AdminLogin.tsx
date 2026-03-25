"use client"

import React, { useState } from "react"
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Leaf, AlertTriangle, Loader2 } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { AuthService } from "@/src/services/auth.service"
import { toast } from "sonner"

type View = "login" | "forgot"

export default function AdminLogin() {
  const { login, isLoading } = useAuth()
  const [view, setView] = useState<View>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotDone, setForgotDone] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const result = await login({ email, password })
      const role = (result as unknown as { role?: string })?.role
      if (role !== "ADMIN") {
        setError("Zugriff verweigert. Nur Administratoren können sich hier anmelden.")
        return
      }
      toast.success("Admin-Anmeldung erfolgreich.")
      window.location.href = "/admin/users"
    } catch {
      setError("Ungültige Anmeldedaten oder fehlende Berechtigung.")
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await AuthService.forgotPassword(forgotEmail) } catch { /* silent */ }
    setForgotDone(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <Leaf className="w-7 h-7 text-teal-400" />
            <span className="text-xl font-bold text-white">Elysion</span>
          </a>
          <div className="inline-flex items-center gap-2 bg-slate-700 text-slate-200 px-4 py-1.5 rounded-full text-sm font-medium border border-slate-600">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Admin-Bereich
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* ── LOGIN ── */}
          {view === "login" && (
            <div className="p-8">
              <h1 className="text-xl font-bold text-slate-800 mb-1">Administrator-Anmeldung</h1>
              <p className="text-slate-500 text-sm mb-6">Nur für autorisierte Administratoren.</p>

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
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="admin@elysion.de" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Passwort" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => setView("forgot")} className="text-sm text-slate-500 hover:text-slate-700">
                    Passwort vergessen?
                  </button>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Anmeldung...</> : "Anmelden"}
                </button>
              </form>
            </div>
          )}

          {/* ── FORGOT ── */}
          {view === "forgot" && (
            <div className="p-8">
              <h1 className="text-xl font-bold text-slate-800 mb-1">Passwort zurücksetzen</h1>
              {!forgotDone ? (
                <>
                  <p className="text-slate-500 text-sm mb-6">Wir senden einen Reset-Link an Ihre Admin-E-Mail.</p>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500" placeholder="admin@elysion.de" />
                    </div>
                    <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-900 transition-colors">
                      Link senden
                    </button>
                  </form>
                </>
              ) : (
                <div className="mt-4 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-slate-600 text-sm">Falls ein Admin-Konto existiert, wurde ein Reset-Link gesendet.</p>
                </div>
              )}
              <div className="mt-6 text-center">
                <button onClick={() => { setView("login"); setForgotDone(false); setForgotEmail("") }} className="text-sm text-slate-500 hover:text-slate-700 font-medium">
                  Zurück zur Anmeldung
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          <a href="/" className="hover:text-slate-300 transition-colors">← Zurück zum Shop</a>
        </p>
      </div>
    </div>
  )
}
