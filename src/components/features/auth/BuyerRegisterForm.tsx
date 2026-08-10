"use client"

import React, { useState } from "react"
import Link from "next/link"
import { User, Building2, XCircle } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { validatePassword, isValidEmail } from "@/src/lib/validation"
import { sellerUrl } from "@/src/lib/seller-url"
import { toast } from "sonner"
import { ErrorAlert } from "@/src/components/shared"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { PasswordField } from "@/src/components/features/auth/_shared/PasswordField"
import { EmailField } from "@/src/components/features/auth/_shared/EmailField"
import { AuthSubmitButton } from "@/src/components/features/auth/_shared/AuthSubmitButton"
import { PasswordStrengthHints } from "@/src/components/features/auth/_shared/PasswordStrengthHints"

interface BuyerRegisterFormProps {
  /** "Bereits ein Konto? Anmelden" — parent switches to the login view. */
  onLoginClick: () => void
  /** After a successful registration — parent closes the modal. */
  onRegistered: () => void
  /** Clicking the "Verkäufer" portal link — parent closes the modal. */
  onSellerLinkClick: () => void
}

export function BuyerRegisterForm({
  onLoginClick,
  onRegistered,
  onSellerLinkClick,
}: BuyerRegisterFormProps) {
  const { register, isLoading } = useAuth()
  const [error, setError] = useState("")

  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirmPassword, setRegConfirmPassword] = useState("")
  const [regFirstName, setRegFirstName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

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
      await register({
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        role: "BUYER" as const,
      })
      toast.success(
        "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Verifizierung."
      )
      onRegistered()
    } catch {
      setError("Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.")
    }
  }

  const pwValidation = validatePassword(regPassword)

  return (
    <div className="p-6">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
          <User className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Konto erstellen</h2>
      </div>
      <p className="mb-6 text-muted-foreground">Starten Sie Ihre nachhaltige Reise.</p>

      {error && <ErrorAlert message={error} className="mb-4" />}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Kontotyp</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-xl border-2 border-green-600 bg-green-50 p-3 text-center text-green-600"
            >
              <User className="mx-auto mb-1 h-5 w-5" />
              <span className="text-sm font-semibold">Käufer</span>
            </button>
            <a
              href={sellerUrl("/login/seller")}
              className="rounded-xl border-2 border-border p-3 text-center text-muted-foreground transition-colors hover:border-green-600 hover:text-green-600"
              onClick={onSellerLinkClick}
            >
              <Building2 className="mx-auto mb-1 h-5 w-5" />
              <span className="text-sm font-semibold">Verkäufer</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">→ Seller Portal</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="reg-fn" className="mb-1 block text-sm font-medium text-foreground">
              Vorname
            </label>
            <Input
              id="reg-fn"
              type="text"
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="reg-ln" className="mb-1 block text-sm font-medium text-foreground">
              Nachname
            </label>
            <Input
              id="reg-ln"
              type="text"
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
              required
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
            <p className="mt-1 flex items-center gap-1 text-xs text-danger">
              <XCircle className="h-3.5 w-3.5" /> Passwörter stimmen nicht überein
            </p>
          )}
        </div>

        {/* DSGVO Art. 7: Datenschutz-Einwilligung */}
        <div className="rounded-xl border border-border bg-secondary p-3">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 accent-green-500"
            />
            <span className="text-xs text-foreground">
              Ich habe die{" "}
              <Link
                href="/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline hover:text-green-600"
              >
                Datenschutzerklärung
              </Link>{" "}
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

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {"Bereits ein Konto? "}
        <Button variant="link" onClick={onLoginClick} className="h-auto p-0 text-green-600">
          Anmelden
        </Button>
      </p>
    </div>
  )
}
