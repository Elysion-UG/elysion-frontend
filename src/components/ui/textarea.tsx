import * as React from "react"

import { cn } from "@/src/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Guide 03 — Formulare: Radius 12, Hairline Ink-18 %, Fokus = Grün-Kontur + 3-px-Grün-Ring.
          "flex min-h-[80px] w-full rounded-xl border-[1.5px] border-input bg-card px-4 py-3 text-base transition-[color,border-color,box-shadow] duration-200 ease-brand placeholder:text-muted-foreground focus-visible:border-green-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-green-500/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
