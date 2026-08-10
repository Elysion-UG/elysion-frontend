import { AlertTriangle } from "lucide-react"
import { cn } from "@/src/lib/utils"

interface ErrorAlertProps {
  message: string
  /** "light" — white background (buyer/seller forms); "dark" — dark background (admin forms) */
  variant?: "light" | "dark"
  className?: string
}

export function ErrorAlert({ message, variant = "light", className }: ErrorAlertProps) {
  const styles =
    variant === "dark"
      ? "border-danger/50 bg-danger/15 text-danger-tint"
      : "border-danger/30 bg-danger-tint text-danger"

  return (
    <div className={cn("flex items-start gap-2 rounded-xl border p-3 text-sm", styles, className)}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
