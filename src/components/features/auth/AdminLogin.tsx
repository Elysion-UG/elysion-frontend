"use client"

import React, { useState } from "react"
import { Eye, EyeOff, Mail, Lock, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react"
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
          <a href="/" className="mb-5 inline-flex flex-col items-center gap-3">
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
          {/* ── LOGIN ── */}
          {view === "login" && (
            <div className="p-8">
              <h1 className="mb-1 font-mono text-lg font-bold tracking-wider text-slate-100">
                Administrator-Anmeldung
              </h1>
              <p className="mb-6 text-sm text-slate-500">Nur für autorisierte Administratoren.</p>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    E-Mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:border-cyber-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
                      placeholder="admin@elysion.de"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    Passwort
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-2.5 pl-10 pr-10 text-slate-100 placeholder-slate-600 focus:border-cyber-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
                      placeholder="Passwort"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-xs text-slate-600 transition-colors hover:text-cyber-400"
                  >
                    Passwort vergessen?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyber-600 py-2.5 font-mono text-sm font-semibold tracking-wider text-white transition-all hover:bg-cyber-500 hover:shadow-[0_0_16px_rgba(6,182,212,0.3)] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> ANMELDUNG…
                    </>
                  ) : (
                    "ANMELDEN"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── FORGOT ── */}
          {view === "forgot" && (
            <div className="p-8">
              <h1 className="mb-1 font-mono text-lg font-bold tracking-wider text-slate-100">
                Passwort zurücksetzen
              </h1>
              {!forgotDone ? (
                <>
                  <p className="mb-6 text-sm text-slate-500">
                    Wir senden einen Reset-Link an Ihre Admin-E-Mail.
                  </p>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:border-cyber-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
                        placeholder="admin@elysion.de"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-cyber-600 py-2.5 font-mono text-sm font-semibold tracking-wider text-white transition-all hover:bg-cyber-500 hover:shadow-[0_0_16px_rgba(6,182,212,0.3)]"
                    >
                      LINK SENDEN
                    </button>
                  </form>
                </>
              ) : (
                <div className="mt-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-cyber-800/60 bg-cyber-950/60">
                    <Mail className="h-6 w-6 text-cyber-400" />
                  </div>
                  <p className="text-sm text-slate-500">
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
                  className="text-xs font-medium text-slate-600 transition-colors hover:text-cyber-400"
                >
                  Zurück zur Anmeldung
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-700">
          <a href="/" className="transition-colors hover:text-slate-400">
            ← Zurück zum Shop
          </a>
        </p>
      </div>
    </div>
  )
}
