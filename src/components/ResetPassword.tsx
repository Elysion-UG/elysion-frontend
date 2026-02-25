"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { AuthService } from "@/src/services/auth.service"
import { validatePassword } from "@/src/lib/validation"
import { toast } from "sonner"

type ResetStatus = "form" | "success" | "invalid-token"

export default function ResetPassword() {
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<ResetStatus>("form")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get("token")
    if (!t) {
      setStatus("invalid-token")
    } else {
      setToken(t)
    }
  }, [])

  const pwValidation = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!pwValidation.valid) {
      setError("Das Passwort erfüllt nicht alle Anforderungen.")
      return
    }
    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    setIsSubmitting(true)
    try {
      await AuthService.resetPassword(token, password)
      setStatus("success")
      toast.success("Passwort erfolgreich zurückgesetzt!")
    } catch {
      setError("Fehler beim Zurücksetzen. Bitte fordern Sie einen neuen Link an.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md p-8">
        {status === "invalid-token" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Ungültiger Link</h1>
            <p className="text-slate-600 mb-6">Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.</p>
            <a href="/" className="inline-block bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors">
              Zur Startseite
            </a>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Passwort zurückgesetzt!</h1>
            <p className="text-slate-600 mb-6">Sie können sich jetzt mit Ihrem neuen Passwort anmelden.</p>
            <a href="/" className="inline-block bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors">
              Zur Anmeldung
            </a>
          </div>
        )}

        {status === "form" && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 mb-2">Neues Passwort festlegen</h1>
              <p className="text-slate-600">Geben Sie Ihr neues Passwort ein.</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-pw" className="block text-sm font-medium text-slate-700 mb-1">Neues Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    id="new-pw"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
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
                <label htmlFor="confirm-pw" className="block text-sm font-medium text-slate-700 mb-1">Passwort bestätigen</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    id="confirm-pw"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800"
                  />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Passwörter stimmen nicht überein</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird gespeichert...</> : "Passwort zurücksetzen"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
