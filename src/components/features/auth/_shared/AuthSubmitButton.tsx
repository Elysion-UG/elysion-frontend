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
    "flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-2.5 font-semibold text-white transition-colors hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-50",
  dark: "flex w-full items-center justify-center gap-2 rounded-xl bg-cyber-600 py-2.5 font-mono text-sm font-semibold tracking-wider text-white transition-all hover:bg-cyber-500 hover:shadow-[0_0_16px_rgba(6,182,212,0.3)] disabled:opacity-50",
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
