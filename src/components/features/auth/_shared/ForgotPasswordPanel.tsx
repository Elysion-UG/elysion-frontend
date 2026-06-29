"use client"

import { useState, type FormEvent } from "react"
import { CheckCircle2, Mail } from "lucide-react"
import { AuthService } from "@/src/services/auth.service"
import { EmailField } from "./EmailField"
import { AuthSubmitButton } from "./AuthSubmitButton"

type Variant = "light" | "dark"

interface ForgotPasswordPanelProps {
  variant?: Variant
  /** Heading text; pass null to suppress (when caller renders its own header) */
  heading?: string | null
  /** Text shown above the email input before submission */
  intro?: string
  /** Text shown after a successful request */
  successMessage?: string
  /** Back-to-login button label */
  backLabel?: string
  /** Submit button label */
  submitLabel?: string
  /** Email placeholder */
  placeholder?: string
  onBack: () => void
}

const styles = {
  light: {
    heading: "mb-1 text-2xl font-bold text-stone-800",
    intro: "mb-6 text-stone-500",
    successText: "text-stone-600",
    successIconBg:
      "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50",
    successIcon: "h-7 w-7 text-emerald-500",
    backBtn: "text-sm font-semibold text-sage-600 hover:text-sage-800",
  },
  dark: {
    heading: "mb-1 font-mono text-lg font-bold tracking-wider text-slate-100",
    intro: "mb-6 text-sm text-slate-500",
    successText: "text-sm text-slate-500",
    successIconBg:
      "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-cyber-800/60 bg-cyber-950/60",
    successIcon: "h-6 w-6 text-cyber-400",
    backBtn: "text-xs font-medium text-slate-600 transition-colors hover:text-cyber-400",
  },
} satisfies Record<Variant, Record<string, string>>

export function ForgotPasswordPanel({
  variant = "light",
  heading = "Passwort zurücksetzen",
  intro = "Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.",
  successMessage = "Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.",
  backLabel = "Zurück zur Anmeldung",
  submitLabel = "Link senden",
  placeholder,
  onBack,
}: ForgotPasswordPanelProps) {
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)
  const s = styles[variant]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await AuthService.forgotPassword(email)
    } catch {
      // Silently ignore errors to prevent email enumeration
    }
    setDone(true)
  }

  return (
    <>
      {heading && <h1 className={s.heading}>{heading}</h1>}

      {!done ? (
        <>
          <p className={s.intro}>{intro}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <EmailField
              value={email}
              onChange={setEmail}
              placeholder={placeholder}
              required
              variant={variant}
            />
            <AuthSubmitButton label={submitLabel} variant={variant} />
          </form>
        </>
      ) : (
        <div className="mt-6 text-center">
          <div className={s.successIconBg}>
            {variant === "dark" ? (
              <Mail className={s.successIcon} />
            ) : (
              <CheckCircle2 className={s.successIcon} />
            )}
          </div>
          <p className={s.successText}>{successMessage}</p>
        </div>
      )}

      <div className="mt-6 text-center">
        <button onClick={onBack} className={s.backBtn}>
          {backLabel}
        </button>
      </div>
    </>
  )
}
