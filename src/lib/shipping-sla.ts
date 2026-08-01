import type { OrderGroupStatus } from "@/src/types"

// ── 48h-Versand-SLA (Management-Decision §1.6, Szenario 1) ────────────
// Da Stripe sofort captured, muss der Seller binnen 48 h nach Capture
// versenden. Diese SLA wird dem Seller im Portal sichtbar gemacht (#57).

export const SHIPPING_SLA_HOURS = 48
const SLA_MS = SHIPPING_SLA_HOURS * 60 * 60 * 1000

export interface ShippingSla {
  /** Nur für bezahlte, noch nicht versandte Order-Groups (CONFIRMED/PROCESSING). */
  applies: boolean
  /** Frist = Capture-Zeit + 48 h. */
  deadline: Date
  /** Verbleibende Millisekunden bis zur Frist (negativ, wenn überschritten). */
  remainingMs: number
  /** Frist überschritten und noch nicht versandt. */
  isOverdue: boolean
}

/**
 * Leitet die 48h-Versand-SLA einer Seller-Order-Group client-seitig ab.
 *
 * Interim bis Backend #143 ein explizites Capture-/Frist-Feld liefert: Stripe
 * captured sofort bei Zahlung, daher gilt `createdAt` der Order-Group als
 * Capture-Zeitpunkt. Die Frist zählt nur für bezahlte, noch nicht versandte
 * Bestellungen (CONFIRMED/PROCESSING) — ab SHIPPED/DELIVERED/CANCELLED entfällt sie.
 */
export function computeShippingSla(
  createdAt: string,
  status: OrderGroupStatus,
  now: Date = new Date()
): ShippingSla {
  const applies = status === "CONFIRMED" || status === "PROCESSING"
  const deadline = new Date(new Date(createdAt).getTime() + SLA_MS)
  const remainingMs = deadline.getTime() - now.getTime()
  return {
    applies,
    deadline,
    remainingMs,
    isOverdue: applies && remainingMs < 0,
  }
}

/** Kompakte, lokalisierte Restzeit-/Überfällig-Beschriftung für Badges. */
export function formatSlaRemaining(remainingMs: number): string {
  if (remainingMs < 0) {
    return "Versand überfällig"
  }
  const totalMinutes = Math.floor(remainingMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  if (hours >= 1) {
    return `Versand in ${hours} h`
  }
  return `Versand in ${totalMinutes} min`
}
