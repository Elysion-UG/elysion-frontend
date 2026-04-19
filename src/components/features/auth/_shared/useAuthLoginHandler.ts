"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/src/context/AuthContext"
import { ApiError, type AuthPortal } from "@/src/lib/api-client"

interface UseAuthLoginHandlerOptions {
  portal: AuthPortal
  /** Message shown for generic auth failures (wrong password, etc.). */
  invalidCredentialsMessage: string
  /** Toast shown after a successful login. Pass null to skip. */
  successToast?: string | null
  /** Callback invoked after successful login (e.g. redirect, modal close). */
  onSuccess?: () => void
}

interface AuthLoginHandler {
  error: string
  setError: (msg: string) => void
  submit: (email: string, password: string) => Promise<void>
}

// Shared login handler for all portals (customer/seller/admin). Centralizes
// ApiError 429 rate-limit handling and generic-failure messaging so each
// login component only supplies the portal and its own redirect behavior.
export function useAuthLoginHandler({
  portal,
  invalidCredentialsMessage,
  successToast,
  onSuccess,
}: UseAuthLoginHandlerOptions): AuthLoginHandler {
  const { login } = useAuth()
  const [error, setError] = useState("")

  const submit = useCallback(
    async (email: string, password: string) => {
      setError("")
      try {
        await login({ email, password }, portal)
        if (successToast !== null && successToast !== undefined) {
          toast.success(successToast)
        }
        onSuccess?.()
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          setError(err.message)
        } else {
          setError(invalidCredentialsMessage)
        }
      }
    },
    [login, portal, invalidCredentialsMessage, successToast, onSuccess]
  )

  return { error, setError, submit }
}
