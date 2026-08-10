"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"

interface AuthSubmitButtonProps {
  /** Label shown when idle */
  label: string
  /** Label shown while submitting (defaults to "…") */
  pendingLabel?: string
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function AuthSubmitButton({
  label,
  pendingLabel,
  isLoading = false,
  disabled = false,
  className,
}: AuthSubmitButtonProps) {
  return (
    <Button type="submit" disabled={isLoading || disabled} className={cn("w-full", className)}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> {pendingLabel ?? label}
        </>
      ) : (
        label
      )}
    </Button>
  )
}
