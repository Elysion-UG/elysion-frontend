"use client"

import type React from "react"
import { useState } from "react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import { X, Mail, User, Building2, XCircle } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { validatePassword, isValidEmail } from "@/src/lib/validation"
import { sellerUrl } from "@/src/lib/seller-url"
import { toast } from "sonner"
import { ErrorAlert } from "@/src/components/shared"
import { PasswordField } from "@/src/components/features/auth/_shared/PasswordField"
import { EmailField } from "@/src/components/features/auth/_shared/EmailField"
import { AuthSubmitButton } from "@/src/components/features/auth/_shared/AuthSubmitButton"
import { ForgotPasswordPanel } from "@/src/components/features/auth/_shared/ForgotPasswordPanel"
import { PasswordStrengthHints } from "@/src/components/features/auth/_shared/PasswordStrengthHints"
import { useAuthLoginHandler } from "@/src/components/features/auth/_shared/useAuthLoginHandler"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

type ModalView = "login" | "register" | "forgot"

const textInputClass =
  "w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-800 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-500/20"

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { register, isLoading } = useAuth()
  const [view, setView] = useState<ModalView>("login")

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirmPassword, setRegConfirmPassword] = useState("")
  const [regFirstName, setRegFirstName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const {
    error,
    setError,
    submit: submitLogin,
  } = useAuthLoginHandler({
    portal: "customer",
    invalidCredentialsMessage: "Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.",
    successToast: "Erfolgreich angemeldet!",
    onSuccess: () => {
      resetAll()
      onClose()
    },
  })

  const resetAll = () => {
    setError("")
    setLoginEmail("")
    setLoginPassword("")
    setRegEmail("")
    setRegPassword("")
    setRegConfirmPassword("")
    setRegFirstName("")
    setRegLastName("")
    setPrivacyAccepted(false)
  }

  const switchView = (v: ModalView) => {
    resetAll()
    setView(v)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    void submitLogin(loginEmail, loginPassword)
  }

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

    try {
      const dto = {
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        role: "BUYER" as const,
      }

      await register(dto)
      toast.success(
        "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Verifizierung."
      )
      resetAll()
      onClose()
    } catch {
      setError("Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.")
    }
  }

  const pwValidation = validatePassword(regPassword)
  const modalRef = useFocusTrap(() => {
    resetAll()
    onClose()
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          view === "login"
            ? "Anmelden"
            : view === "register"
              ? "Konto erstellen"
              : "Passwort vergessen"
        }
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <button
          onClick={() => {
            resetAll()
            onClose()
          }}
          className="absolute right-4 top-4 text-stone-400 transition-colors hover:text-stone-600"
          aria-label="Schliessen"
        >
          <X className="h-5 w-5" />
        </button>

        {view === "login" && (
          <div className="p-6">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600">
                <User className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">Willkommen zurück</h2>
            </div>
            <p className="mb-6 text-stone-500">Melden Sie sich an, um fortzufahren.</p>

            {error && <ErrorAlert message={error} className="mb-4" />}

            <form onSubmit={handleLogin} className="space-y-4">
              <EmailField
                id="login-email"
                label="E-Mail"
                value={loginEmail}
                onChange={setLoginEmail}
                required
              />

              <PasswordField
                id="login-pw"
                label="Passwort"
                value={loginPassword}
                onChange={setLoginPassword}
                placeholder="Passwort"
                required
              />

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchView("forgot")}
                  className="text-sm text-sage-600 hover:text-sage-800"
                >
                  Passwort vergessen?
                </button>
              </div>

              <AuthSubmitButton
                label="Anmelden"
                pendingLabel="Anmeldung..."
                isLoading={isLoading}
              />
            </form>

            <p className="mt-4 text-center text-sm text-stone-500">
              {"Noch kein Konto? "}
              <button
                onClick={() => switchView("register")}
                className="font-semibold text-sage-600 hover:text-sage-800"
              >
                Registrieren
              </button>
            </p>
          </div>
        )}

        {view === "register" && (
          <div className="p-6">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600">
                <User className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">Konto erstellen</h2>
            </div>
            <p className="mb-6 text-stone-500">Starten Sie Ihre nachhaltige Reise.</p>

            {error && <ErrorAlert message={error} className="mb-4" />}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Kontotyp</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="rounded-xl border-2 border-sage-600 bg-sage-50 p-3 text-center text-sage-700"
                  >
                    <User className="mx-auto mb-1 h-5 w-5" />
                    <span className="text-sm font-semibold">Käufer</span>
                  </button>
                  <a
                    href={sellerUrl("/login/seller")}
                    className="rounded-xl border-2 border-stone-200 p-3 text-center text-stone-500 transition-colors hover:border-sage-300 hover:text-sage-600"
                    onClick={() => {
                      resetAll()
                      onClose()
                    }}
                  >
                    <Building2 className="mx-auto mb-1 h-5 w-5" />
                    <span className="text-sm font-semibold">Verkäufer</span>
                    <span className="mt-0.5 block text-[10px] text-stone-400">→ Seller Portal</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-fn" className="mb-1 block text-sm font-medium text-stone-700">
                    Vorname
                  </label>
                  <input
                    id="reg-fn"
                    type="text"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    required
                    className={textInputClass}
                  />
                </div>
                <div>
                  <label htmlFor="reg-ln" className="mb-1 block text-sm font-medium text-stone-700">
                    Nachname
                  </label>
                  <input
                    id="reg-ln"
                    type="text"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    required
                    className={textInputClass}
                  />
                </div>
              </div>

              <EmailField
                id="reg-email"
                label="E-Mail"
                value={regEmail}
                onChange={setRegEmail}
                required
              />

              <div>
                <PasswordField
                  id="reg-pw"
                  label="Passwort"
                  value={regPassword}
                  onChange={setRegPassword}
                  required
                  autoComplete="new-password"
                />
                <PasswordStrengthHints password={regPassword} results={pwValidation.results} />
              </div>

              <div>
                <PasswordField
                  id="reg-cpw"
                  label="Passwort bestätigen"
                  value={regConfirmPassword}
                  onChange={setRegConfirmPassword}
                  required
                  autoComplete="new-password"
                />
                {regConfirmPassword.length > 0 && regPassword !== regConfirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3.5 w-3.5" /> Passwörter stimmen nicht überein
                  </p>
                )}
              </div>

              {/* DSGVO Art. 7: Datenschutz-Einwilligung */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 accent-sage-600"
                  />
                  <span className="text-xs text-stone-600">
                    Ich habe die{" "}
                    <a
                      href="/datenschutz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sage-600 underline hover:text-sage-800"
                    >
                      Datenschutzerklärung
                    </a>{" "}
                    gelesen und stimme der Verarbeitung meiner Daten zu. *
                  </span>
                </label>
              </div>

              <AuthSubmitButton
                label="Konto erstellen"
                pendingLabel="Registrierung..."
                isLoading={isLoading}
                disabled={!privacyAccepted}
              />
            </form>

            <p className="mt-4 text-center text-sm text-stone-500">
              {"Bereits ein Konto? "}
              <button
                onClick={() => switchView("login")}
                className="font-semibold text-sage-600 hover:text-sage-800"
              >
                Anmelden
              </button>
            </p>
          </div>
        )}

        {view === "forgot" && (
          <div className="p-6">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-stone-800">Passwort vergessen</h2>
            </div>
            <ForgotPasswordPanel heading={null} onBack={() => switchView("login")} />
          </div>
        )}
      </div>
    </div>
  )
}
