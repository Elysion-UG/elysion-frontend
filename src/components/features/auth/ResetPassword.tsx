"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { AuthService } from "@/src/services/auth.service"
import { validatePassword } from "@/src/lib/validation"
import { toast } from "sonner"

type ResetStatus = "validating" | "form" | "success" | "invalid-token"

export default function ResetPassword() {
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<ResetStatus>("validating")
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
      return
    }
    setToken(t)
    AuthService.validateResetToken(t)
      .then(() => {
        setStatus("form")
      })
      .catch(() => {
        setStatus("invalid-token")
      })
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
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg">
        {status === "validating" && (
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-sage-600" />
            <h1 className="mb-2 text-xl font-bold text-stone-800">Link wird geprüft...</h1>
            <p className="text-stone-500">Bitte warten Sie einen Moment.</p>
          </div>
        )}

        {status === "invalid-token" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-stone-800">Ungültiger Link</h1>
            <p className="mb-6 text-stone-600">
              Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-sage-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-sage-700"
            >
              Zur Startseite
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-stone-800">Passwort zurückgesetzt!</h1>
            <p className="mb-6 text-stone-600">
              Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-sage-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-sage-700"
            >
              Zur Anmeldung
            </Link>
          </div>
        )}

        {status === "form" && (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
                <Lock className="h-8 w-8 text-sage-600" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-stone-800">Neues Passwort festlegen</h1>
              <p className="text-stone-500">Geben Sie Ihr neues Passwort ein.</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-pw" className="mb-1 block text-sm font-medium text-stone-700">
                  Neues Passwort
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="new-pw"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {password.length > 0 && (
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
                <label
                  htmlFor="confirm-pw"
                  className="mb-1 block text-sm font-medium text-stone-700"
                >
                  Passwort bestätigen
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="confirm-pw"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
                  />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3.5 w-3.5" /> Passwörter stimmen nicht überein
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-2.5 font-semibold text-white transition-colors hover:bg-sage-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Wird gespeichert...
                  </>
                ) : (
                  "Passwort zurücksetzen"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
