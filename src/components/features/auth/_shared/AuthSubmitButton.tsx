"use client"

import { Loader2 } from "lucide-react"

type Variant = "light" | "dark"

interface AuthSubmitButtonProps {
  /** Label shown when idle */
  label: string
  /** Label shown while submitting (defaults to "…") */
  pendingLabel?: string
  isLoading?: boolean
  disabled?: boolean
  variant?: Variant
  className?: string
}

const styles = {
  light:
    "flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 font-semibold text-ink-900 transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50",
  dark: "flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-bold tracking-wide text-ink-900 transition-all hover:bg-green-600 disabled:opacity-50",
} satisfies Record<Variant, string>

export function AuthSubmitButton({
  label,
  pendingLabel,
  isLoading = false,
  disabled = false,
  variant = "light",
  className,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className={`${styles[variant]} ${className ?? ""}`.trim()}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {pendingLabel ?? label}
        </>
      ) : (
        label
      )}
    </button>
  )
}
