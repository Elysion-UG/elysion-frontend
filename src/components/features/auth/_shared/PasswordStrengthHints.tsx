import { CheckCircle2, XCircle } from "lucide-react"
import type { PasswordValidationResult } from "@/src/lib/validation"

interface PasswordStrengthHintsProps {
  password: string
  results: PasswordValidationResult["results"]
  variant?: "light" | "dark"
}

export function PasswordStrengthHints({
  password,
  results,
  variant = "light",
}: PasswordStrengthHintsProps) {
  if (password.length === 0) return null

  const passedColor = variant === "dark" ? "text-emerald-400" : "text-emerald-600"
  const pendingColor = variant === "dark" ? "text-slate-500" : "text-stone-400"

  return (
    <ul className="mt-2 space-y-1">
      {results.map((r) => (
        <li
          key={r.label}
          className={`flex items-center gap-1.5 text-xs ${r.passed ? passedColor : pendingColor}`}
        >
          {r.passed ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {r.label}
        </li>
      ))}
    </ul>
  )
}
