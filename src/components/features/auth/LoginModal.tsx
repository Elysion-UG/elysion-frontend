"use client"

import { useState } from "react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import { X, Mail, User } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { LoginForm } from "@/src/components/features/auth/_shared/LoginForm"
import { BuyerRegisterForm } from "@/src/components/features/auth/BuyerRegisterForm"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Invoked after a successful login (before the modal is torn down). Lets the
   * host return the user to a deep link they were bounced off (#121). When
   * omitted, a successful login simply closes the modal.
   */
  onLoginSuccess?: () => void
}

type Mode = "login" | "register"

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<Mode>("login")
  // Tracks the LoginForm's internal login/forgot view to keep the dialog
  // aria-label in sync (the forgot view is owned by LoginForm).
  const [loginSubView, setLoginSubView] = useState<"login" | "forgot">("login")

  const handleClose = () => {
    setMode("login")
    setLoginSubView("login")
    onClose()
  }

  const handleLoginSuccess = () => {
    handleClose()
    onLoginSuccess?.()
  }

  const modalRef = useFocusTrap(handleClose)

  if (!isOpen) return null

  const ariaLabel =
    mode === "register"
      ? "Konto erstellen"
      : loginSubView === "forgot"
        ? "Passwort vergessen"
        : "Anmelden"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Schliessen"
        >
          <X className="h-5 w-5" />
        </button>

        {mode === "login" ? (
          <div className="p-6">
            <LoginForm
              portal="customer"
              invalidCredentialsMessage="Ungültige Anmeldedaten. Bitte versuchen Sie es erneut."
              successToast="Erfolgreich angemeldet!"
              onSuccess={handleLoginSuccess}
              emailId="login-email"
              passwordId="login-pw"
              onViewChange={setLoginSubView}
              loginHeader={
                <>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Willkommen zurück</h2>
                  </div>
                  <p className="mb-6 text-muted-foreground">Melden Sie sich an, um fortzufahren.</p>
                </>
              }
              loginFooter={
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {"Noch kein Konto? "}
                  <Button
                    variant="link"
                    onClick={() => setMode("register")}
                    className="h-auto p-0 text-green-600"
                  >
                    Registrieren
                  </Button>
                </p>
              }
              forgot={{
                heading: null,
                header: (
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Passwort vergessen</h2>
                  </div>
                ),
              }}
            />
          </div>
        ) : (
          <BuyerRegisterForm
            onLoginClick={() => setMode("login")}
            onRegistered={handleClose}
            onSellerLinkClick={handleClose}
          />
        )}
      </div>
    </div>
  )
}
