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
      await login({ email, password }, "admin")
      toast.success("Admin-Anmeldung erfolgreich.")
      window.location.href = "/admin/users"
    } catch {
      setError("Ungültige Anmeldedaten oder fehlende Berechtigung.")
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <a href="/" className="mb-4 inline-flex items-center gap-2">
            <Leaf className="h-7 w-7 text-teal-400" />
            <span className="text-xl font-bold text-white">Elysion</span>
          </a>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-700 px-4 py-1.5 text-sm font-medium text-slate-200">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            Admin-Bereich
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* ── LOGIN ── */}
          {view === "login" && (
            <div className="p-8">
              <h1 className="mb-1 text-xl font-bold text-slate-800">Administrator-Anmeldung</h1>
              <p className="mb-6 text-sm text-slate-500">Nur für autorisierte Administratoren.</p>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 focus:border-slate-500 focus:ring-2 focus:ring-slate-500"
                      placeholder="admin@elysion.de"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Passwort</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-10 focus:border-slate-500 focus:ring-2 focus:ring-slate-500"
                      placeholder="Passwort"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Passwort vergessen?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 font-semibold text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
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
            </div>
          )}

          {/* ── FORGOT ── */}
          {view === "forgot" && (
            <div className="p-8">
              <h1 className="mb-1 text-xl font-bold text-slate-800">Passwort zurücksetzen</h1>
              {!forgotDone ? (
                <>
                  <p className="mb-6 text-sm text-slate-500">
                    Wir senden einen Reset-Link an Ihre Admin-E-Mail.
                  </p>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-slate-500"
                        placeholder="admin@elysion.de"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-slate-800 py-2.5 font-semibold text-white transition-colors hover:bg-slate-900"
                    >
                      Link senden
                    </button>
                  </form>
                </>
              ) : (
                <div className="mt-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Mail className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    Falls ein Admin-Konto existiert, wurde ein Reset-Link gesendet.
                  </p>
                </div>
              )}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setView("login")
                    setForgotDone(false)
                    setForgotEmail("")
                  }}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Zurück zur Anmeldung
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          <a href="/" className="transition-colors hover:text-slate-300">
            ← Zurück zum Shop
          </a>
        </p>
      </div>
    </div>
  )
}
