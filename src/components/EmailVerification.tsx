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

  // Extract token from search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    if (token) {
      setStatus("loading")
      AuthService.verifyEmail(token)
        .then((res) => {
          setStatus(res.success ? "success" : "error")
        })
        .catch(() => {
          setStatus("error")
        })
    }
  }, [])

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      // Simulate resend
      await new Promise((r) => setTimeout(r, 1500))
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
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md p-8">
        {/* Loading */}
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-800 mb-2">E-Mail wird verifiziert...</h1>
            <p className="text-slate-600">Bitte warten Sie einen Moment.</p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">E-Mail verifiziert!</h1>
            <p className="text-slate-600 mb-6">Ihr Konto wurde erfolgreich verifiziert. Sie können sich jetzt anmelden.</p>
            <button
              onClick={handleBackToLogin}
              className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Zur Anmeldung
            </button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Verifizierung fehlgeschlagen</h1>
            <p className="text-slate-600 mb-6">
              Der Verifizierungslink ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.
            </p>
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isResending ? <><Loader2 className="w-4 h-4 animate-spin" /> Senden...</> : <><RefreshCw className="w-4 h-4" /> Neuen Link anfordern</>}
            </button>
          </div>
        )}

        {/* Awaiting — no token in URL, user was redirected from registration */}
        {status === "awaiting" && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 mb-2">Überprüfen Sie Ihre E-Mails</h1>
              <p className="text-slate-600">
                Wir haben Ihnen einen Verifizierungslink gesendet. Klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
              </p>
            </div>

            <div className="space-y-3 mb-6 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <span>Klicken Sie auf den Verifizierungslink in Ihrer E-Mail</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <span>Prüfen Sie auch Ihren Spam-Ordner</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <span>Der Link ist 24 Stunden gültig</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isResending ? <><Loader2 className="w-4 h-4 animate-spin" /> Senden...</> : <><Mail className="w-4 h-4" /> Erneut senden</>}
              </button>

              {resendCount > 0 && (
                <p className="text-center text-sm text-teal-600">
                  E-Mail gesendet! ({resendCount}x)
                </p>
              )}

              <button
                onClick={handleBackToLogin}
                className="w-full border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
