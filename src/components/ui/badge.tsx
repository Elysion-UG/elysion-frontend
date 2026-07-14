import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/lib/utils"

// Elysion Website Design System v1.3 · Guide 02/05 — Pill-Badges.
// Text darauf immer Ink; Funktions-Tints nur für Systemzustände.
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-[3px] focus:ring-green-500/40",
  {
    variants: {
      variant: {
        // Grün (Handlung/Nachweis) mit Ink-Label.
        default: "border-transparent bg-primary text-primary-foreground hover:bg-green-600",
        // Grün-Tint für positive Badges (Guide 02) — Text Ink.
        "green-tint": "border-transparent bg-green-50 text-ink-900",
        // Sand-Chip (Guide 01 · Meta/Launch).
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        // Funktionsfarben — nur Systemzustände (Guide 02): Soft-Tint + Ink-Text.
        success: "border-transparent bg-success-tint text-ink-900",
        warning: "border-transparent bg-warning-tint text-ink-900",
        info: "border-transparent bg-info-tint text-ink-900",
        destructive: "border-transparent bg-danger-tint text-ink-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
