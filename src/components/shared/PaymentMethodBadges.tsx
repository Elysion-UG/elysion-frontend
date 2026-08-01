import { cn } from "@/src/lib/utils"

// ── Akzeptierte Zahlarten zum Launch (Management-Decision §1.3) ───────
// Reine Kommunikation der aktivierten Stripe-Methoden. Text statt
// Marken-Logos: markenrechts- und CSP-sicher, ohne externe Assets.
// SEPA-Lastschrift ist Fast-Follow und wird bewusst NICHT kommuniziert.
const PAYMENT_METHODS = [
  { label: "Visa", aria: "Visa" },
  { label: "Mastercard", aria: "Mastercard" },
  { label: "PayPal", aria: "PayPal" },
  { label: "Apple Pay", aria: "Apple Pay" },
  { label: "Google Pay", aria: "Google Pay" },
  { label: "Klarna", aria: "Klarna — Kauf auf Rechnung" },
] as const

const TONE_CLASS = {
  light: "border-border bg-white text-foreground",
  dark: "border-white/15 bg-white/5 text-sand-page/80",
} as const

interface PaymentMethodBadgesProps {
  /** "light" für helle Flächen (Checkout), "dark" für das Ink-Footer-Band. */
  tone?: keyof typeof TONE_CLASS
  className?: string
}

export function PaymentMethodBadges({ tone = "light", className }: PaymentMethodBadgesProps) {
  return (
    <ul
      aria-label="Akzeptierte Zahlungsarten"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {PAYMENT_METHODS.map((method) => (
        <li
          key={method.label}
          aria-label={method.aria}
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
            TONE_CLASS[tone]
          )}
        >
          {method.label}
        </li>
      ))}
    </ul>
  )
}
