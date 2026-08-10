"use client"

import React, { useState } from "react"
import { XCircle } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { validatePassword, isValidEmail } from "@/src/lib/validation"
import { toast } from "sonner"
import { ErrorAlert } from "@/src/components/shared"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { PasswordField } from "@/src/components/features/auth/_shared/PasswordField"
import { EmailField } from "@/src/components/features/auth/_shared/EmailField"
import { AuthSubmitButton } from "@/src/components/features/auth/_shared/AuthSubmitButton"
import { PasswordStrengthHints } from "@/src/components/features/auth/_shared/PasswordStrengthHints"

interface SellerRegisterFormProps {
  /** "Bereits registriert? Anmelden" — parent switches to the login view. */
  onLoginClick: () => void
  /** After a successful registration — parent switches to the login view. */
  onRegistered: () => void
}

export function SellerRegisterForm({ onLoginClick, onRegistered }: SellerRegisterFormProps) {
  const { register, isLoading } = useAuth()
  const [error, setError] = useState("")

  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regConfirm, setRegConfirm] = useState("")
  const [regFirstName, setRegFirstName] = useState("")
  const [regLastName, setRegLastName] = useState("")
  const [regCompany, setRegCompany] = useState("")
  const [regVatId, setRegVatId] = useState("")
  const [regIban, setRegIban] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!isValidEmail(regEmail)) {
      setError("Ungültige E-Mail-Adresse.")
      return
    }
    if (!validatePassword(regPassword).valid) {
      setError("Das Passwort erfüllt nicht alle Anforderungen.")
      return
    }
    if (regPassword !== regConfirm) {
      setError("Passwörter stimmen nicht überein.")
      return
    }
    if (!regCompany || !regVatId || !regIban) {
      setError("Bitte alle Pflichtfelder ausfüllen.")
      return
    }
    try {
      await register({
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        role: "SELLER",
        companyName: regCompany,
        vatId: regVatId,
        iban: regIban,
      })
      toast.success("Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails.")
      onRegistered()
    } catch {
      setError("Registrierung fehlgeschlagen. E-Mail bereits vergeben?")
    }
  }

  const pwCheck = validatePassword(regPassword)

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Als Verkäufer registrieren</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Verkaufen Sie Ihre nachhaltigen Produkte auf Elysion.
      </p>

      {error && <ErrorAlert message={error} className="mb-5" />}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Vorname</label>
            <Input
              type="text"
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
              required
              className="text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nachname</label>
            <Input
              type="text"
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
              required
              className="text-sm"
            />
          </div>
        </div>

        <EmailField
          label="E-Mail *"
          value={regEmail}
          onChange={setRegEmail}
          placeholder="ihre@firma.de"
          required
        />

        <div>
          <PasswordField
            label="Passwort *"
            value={regPassword}
            onChange={setRegPassword}
            required
            autoComplete="new-password"
          />
          <PasswordStrengthHints password={regPassword} results={pwCheck.results} />
        </div>

        <div>
          <PasswordField
            label="Passwort bestätigen *"
            value={regConfirm}
            onChange={setRegConfirm}
            required
            autoComplete="new-password"
          />
          {regConfirm.length > 0 && regPassword !== regConfirm && (
            <p className="mt-1 flex items-center gap-1 text-xs text-danger">
              <XCircle className="h-3.5 w-3.5" /> Stimmt nicht überein
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-secondary p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unternehmensdaten
          </p>
          <div>
            <label className="mb-1 block text-sm text-foreground">Firmenname *</label>
            <Input
              type="text"
              value={regCompany}
              onChange={(e) => setRegCompany(e.target.value)}
              required
              className="bg-white text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-foreground">USt-IdNr. *</label>
            <Input
              type="text"
              value={regVatId}
              onChange={(e) => setRegVatId(e.target.value)}
              required
              placeholder="DE123456789"
              className="bg-white text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-foreground">IBAN *</label>
            <Input
              type="text"
              value={regIban}
              onChange={(e) => setRegIban(e.target.value)}
              required
              placeholder="DE89 3704 0044 …"
              className="bg-white text-sm"
            />
          </div>
        </div>

        <AuthSubmitButton
          label="Verkäufer-Konto erstellen"
          pendingLabel="Registrierung..."
          isLoading={isLoading}
        />
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Bereits registriert?{" "}
        <Button variant="link" onClick={onLoginClick} className="h-auto p-0 text-green-600">
          Anmelden
        </Button>
      </p>
    </>
  )
}
