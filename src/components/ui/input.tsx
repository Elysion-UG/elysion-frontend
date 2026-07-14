import * as React from "react"

import { cn } from "@/src/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Guide 03 — Formulare: Radius 12, Hairline Ink-18 %, Fokus = Grün-Kontur + 3-px-Grün-Ring.
          "flex h-11 w-full rounded-xl border-[1.5px] border-input bg-card px-4 py-2 text-base transition-[color,border-color,box-shadow] duration-200 ease-brand file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-green-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-green-500/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
