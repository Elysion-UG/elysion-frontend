"use client"

import React, { useState, type ReactNode } from "react"
import { useAuth } from "@/src/context/AuthContext"
import type { AuthPortal } from "@/src/lib/api-client"
import { ErrorAlert } from "@/src/components/shared"
import { EmailField } from "./EmailField"
import { PasswordField } from "./PasswordField"
import { AuthSubmitButton } from "./AuthSubmitButton"
import { ForgotPasswordPanel } from "./ForgotPasswordPanel"
import { useAuthLoginHandler } from "./useAuthLoginHandler"

type Variant = "light" | "dark"

export interface LoginFormForgotConfig {
  /** Custom header rendered above the panel (e.g. a modal icon header). */
  header?: ReactNode
  /** ForgotPasswordPanel heading; pass null to suppress. */
  heading?: string | null
  intro?: string
  successMessage?: string
  backLabel?: string
  submitLabel?: string
  placeholder?: string
}

export interface LoginFormProps {
  /** Determines the login endpoint (customer/seller/admin). */
  portal: AuthPortal
  variant?: Variant
  /** Generic auth-failure message. */
  invalidCredentialsMessage: string
  /** Success toast; pass null to skip. */
  successToast?: string | null
  /** Invoked after a successful login (redirect / close modal). */
  onSuccess: () => void

  emailLabel?: string
  passwordLabel?: string
  emailPlaceholder?: string
  passwordPlaceholder?: string
  /** Fixed field ids (LoginModal pins "login-email"/"login-pw"). */
  emailId?: string
  passwordId?: string

  submitLabel?: string
  submitPendingLabel?: string

  /** Margin/utility classes on the ErrorAlert. */
  errorClassName?: string

  /** Rendered above the error/form in the login view. */
  loginHeader?: ReactNode
  /** Rendered below the form in the login view (e.g. register link). */
  loginFooter?: ReactNode

  forgot: LoginFormForgotConfig

  /** Notifies the parent of view changes (e.g. for a dialog aria-label). */
  onViewChange?: (view: "login" | "forgot") => void
}

const forgotLinkClass: Record<Variant, string> = {
  light: "text-sm text-sage-600 hover:text-sage-800",
  dark: "text-xs text-slate-600 transition-colors hover:text-cyber-400",
}

/**
 * Shared login/forgot-password form for every portal. Owns the email/password
 * state and the login↔forgot toggle; the portal-specific chrome (modal, split
 * panel, brand header) and the register flow stay in the wrapping component.
 */
export function LoginForm({
  portal,
  variant = "light",
  invalidCredentialsMessage,
  successToast,
  onSuccess,
  emailLabel = "E-Mail",
  passwordLabel = "Passwort",
  emailPlaceholder,
  passwordPlaceholder = "Passwort",
  emailId,
  passwordId,
  submitLabel = "Anmelden",
  submitPendingLabel = "Anmeldung...",
  errorClassName = "mb-4",
  loginHeader,
  loginFooter,
  forgot,
  onViewChange,
}: LoginFormProps) {
  const { isLoading } = useAuth()
  const [view, setView] = useState<"login" | "forgot">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { error, setError, submit } = useAuthLoginHandler({
    portal,
    invalidCredentialsMessage,
    successToast,
    onSuccess,
  })

  const goToView = (next: "login" | "forgot") => {
    setError("")
    setEmail("")
    setPassword("")
    setView(next)
    onViewChange?.(next)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    void submit(email, password)
  }

  if (view === "forgot") {
    return (
      <>
        {forgot.header}
        <ForgotPasswordPanel
          variant={variant}
          heading={forgot.heading}
          intro={forgot.intro}
          successMessage={forgot.successMessage}
          backLabel={forgot.backLabel}
          submitLabel={forgot.submitLabel}
          placeholder={forgot.placeholder}
          onBack={() => goToView("login")}
        />
      </>
    )
  }

  return (
    <>
      {loginHeader}

      {error && <ErrorAlert message={error} variant={variant} className={errorClassName} />}

      <form onSubmit={handleLogin} className="space-y-4">
        <EmailField
          id={emailId}
          label={emailLabel}
          value={email}
          onChange={setEmail}
          placeholder={emailPlaceholder}
          required
          variant={variant}
        />
        <PasswordField
          id={passwordId}
          label={passwordLabel}
          value={password}
          onChange={setPassword}
          placeholder={passwordPlaceholder}
          required
          variant={variant}
        />
        <div className="text-right">
          <button
            type="button"
            onClick={() => goToView("forgot")}
            className={forgotLinkClass[variant]}
          >
            Passwort vergessen?
          </button>
        </div>
        <AuthSubmitButton
          label={submitLabel}
          pendingLabel={submitPendingLabel}
          isLoading={isLoading}
          variant={variant}
        />
      </form>

      {loginFooter}
    </>
  )
}
