"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useEffectEvent } from "@/src/hooks/use-effect-event"
import Link from "next/link"
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { AuthService } from "@/src/services/auth.service"
import { validatePassword } from "@/src/lib/validation"
import { Button, buttonVariants } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { cn } from "@/src/lib/utils"
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

  const validateTokenFromUrl = useEffectEvent(() => {
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
  })

  useEffect(() => {
    validateTokenFromUrl()
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
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-lg">
        {status === "validating" && (
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-green-600" />
            <h1 className="mb-2 text-xl font-bold text-foreground">Link wird geprüft...</h1>
            <p className="text-muted-foreground">Bitte warten Sie einen Moment.</p>
          </div>
        )}

        {status === "invalid-token" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger-tint">
              <AlertTriangle className="h-8 w-8 text-danger" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-foreground">Ungültiger Link</h1>
            <p className="mb-6 text-foreground">
              Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.
            </p>
            <Link href="/" className={cn(buttonVariants(), "px-6")}>
              Zur Startseite
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-foreground">Passwort zurückgesetzt!</h1>
            <p className="mb-6 text-foreground">
              Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
            </p>
            <Link href="/" className={cn(buttonVariants(), "px-6")}>
              Zur Anmeldung
            </Link>
          </div>
        )}

        {status === "form" && (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <Lock className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-foreground">Neues Passwort festlegen</h1>
              <p className="text-muted-foreground">Geben Sie Ihr neues Passwort ein.</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-danger bg-danger-tint p-3 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-pw" className="mb-1 block text-sm font-medium text-foreground">
                  Neues Passwort
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-pw"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {pwValidation.results.map((r) => (
                      <li
                        key={r.label}
                        className={`flex items-center gap-1.5 text-xs ${r.passed ? "text-green-600" : "text-muted-foreground"}`}
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
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Passwort bestätigen
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-pw"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                    <XCircle className="h-3.5 w-3.5" /> Passwörter stimmen nicht überein
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Wird gespeichert...
                  </>
                ) : (
                  "Passwort zurücksetzen"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
