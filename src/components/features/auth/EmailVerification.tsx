"use client"

import { useState, useEffect } from "react"
import { Mail, CheckCircle, XCircle, RefreshCw, ArrowLeft, Loader2 } from "lucide-react"
import { AuthService } from "@/src/services/auth.service"
import { toast } from "sonner"

type VerifyStatus = "loading" | "success" | "error" | "awaiting"

export default function EmailVerification() {
  const [status, setStatus] = useState<VerifyStatus>("awaiting")
  const [isResending, setIsResending] = useState(false)
  const [resendCount, setResendCount] = useState(0)
  const [email, setEmail] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    if (token) {
      setStatus("loading")
      AuthService.verifyEmail(token)
        .then(() => {
          setStatus("success")
        })
        .catch(() => {
          setStatus("error")
        })
    }
  }, [])

  const handleResendEmail = async () => {
    if (!email.trim()) {
      toast.error("Bitte geben Sie Ihre E-Mail-Adresse ein.")
      return
    }
    setIsResending(true)
    try {
      await AuthService.resendVerification(email.trim())
      setResendCount((c) => c + 1)
      toast.success("Verifizierungs-E-Mail wurde erneut gesendet!")
    } catch {
      toast.error("Fehler beim erneuten Senden.")
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToLogin = () => {
    window.location.href = "/"
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg">
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-sage-600" />
            <h1 className="mb-2 text-xl font-bold text-stone-800">E-Mail wird verifiziert...</h1>
            <p className="text-stone-500">Bitte warten Sie einen Moment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-stone-800">E-Mail verifiziert!</h1>
            <p className="mb-6 text-stone-500">
              Ihr Konto wurde erfolgreich verifiziert. Sie können sich jetzt anmelden.
            </p>
            <button
              onClick={handleBackToLogin}
              className="w-full rounded-xl bg-sage-600 py-2.5 font-semibold text-white transition-colors hover:bg-sage-700"
            >
              Zur Anmeldung
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-stone-800">Verifizierung fehlgeschlagen</h1>
            <p className="mb-6 text-stone-500">
              Der Verifizierungslink ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen
              Link an.
            </p>
            <input
              type="email"
              placeholder="Ihre E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
            />
            <button
              onClick={handleResendEmail}
              disabled={isResending || !email.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-2.5 font-semibold text-white transition-colors hover:bg-sage-700 disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Senden...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" /> Neuen Link anfordern
                </>
              )}
            </button>
          </div>
        )}

        {/* Awaiting — no token in URL, user was redirected from registration */}
        {status === "awaiting" && (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
                <Mail className="h-8 w-8 text-sage-600" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-stone-800">Überprüfen Sie Ihre E-Mails</h1>
              <p className="text-stone-500">
                Wir haben Ihnen einen Verifizierungslink gesendet. Klicken Sie auf den Link in der
                E-Mail, um Ihr Konto zu aktivieren.
              </p>
            </div>

            <div className="mb-6 space-y-3 text-sm text-stone-500">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-600" />
                <span>Klicken Sie auf den Verifizierungslink in Ihrer E-Mail</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-600" />
                <span>Prüfen Sie auch Ihren Spam-Ordner</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-600" />
                <span>Der Link ist 24 Stunden gültig</span>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="Ihre E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"
              />
              <button
                onClick={handleResendEmail}
                disabled={isResending || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-2.5 font-semibold text-white transition-colors hover:bg-sage-700 disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Senden...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" /> Erneut senden
                  </>
                )}
              </button>

              {resendCount > 0 && (
                <p className="text-center text-sm text-sage-600">
                  E-Mail gesendet! ({resendCount}x)
                </p>
              )}

              <button
                onClick={handleBackToLogin}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 py-2.5 font-semibold text-stone-700 transition-colors hover:bg-stone-50"
              >
                <ArrowLeft className="h-4 w-4" /> Zurück zur Startseite
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
