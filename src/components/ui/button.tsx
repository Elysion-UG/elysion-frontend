import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/lib/utils"

// Elysion Website Design System v1.3 · Guide 03 — Buttons:
// Radius 12 (rounded-xl), Label 700, Fokus = 3-px-Grün-Ring, Motion brand + Press-Scale.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-green-500/40 active:scale-[0.985] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primär: Logo-Grün mit Ink-Label (6,3:1), Hover dunkelt auf #45963A ab.
        // Disabled: Sand-Fläche mit gedämpftem Label — nie halbtransparentes Grün.
        default:
          "bg-primary text-primary-foreground hover:bg-green-600 disabled:bg-secondary disabled:text-muted-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50",
        // Sekundär: Ink-Kontur 1.5 px, Hover Sand-Fläche.
        outline:
          "border-[1.5px] border-foreground bg-transparent text-foreground hover:bg-secondary disabled:opacity-50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50",
        ghost: "hover:bg-accent hover:text-accent-foreground disabled:opacity-50",
        link: "font-semibold text-foreground underline-offset-4 hover:underline disabled:opacity-50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        // Marketing-CTA: Body-Größe 17px (Guide 01), großzügige Hit-Fläche.
        lg: "h-12 px-8 text-[17px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
