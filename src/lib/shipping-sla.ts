import type { ShippingSla } from "@/src/types"
import { SHIPPING_SLA_STATUS_LABEL } from "@/src/lib/constants/status-labels"

// ── Versand-SLA (Management-Decision §1.6, Szenario 1) ────────────────
// Die Frist wird nicht mehr client-seitig geraten. Das Backend (#143) friert
// sie beim Zahlungseinzug pro Order-Group ein und liefert an den
// Seller-Order-Reads `shippingSla { status, deadlineAt, breachedAt }`.
//
// Deshalb steht hier auch keine 48h-Konstante mehr: das Fenster ist
// Server-Konfiguration (`app.orders.shipping-sla-duration`) und kann ohne
// Frontend-Release geändert werden. Und die Terminalzustände MET/MISSED —
// rechtzeitig bzw. verspätet versandt — kann eine Client-Heuristik aus
// `createdAt` und Status überhaupt nicht ausdrücken.

/**
 * True, wenn zu dieser Order-Group eine Frist anzuzeigen ist.
 * `NOT_APPLICABLE` und ein fehlendes Feld (Altbestellung) bedeuten beide:
 * gar nichts anzeigen.
 */
export function hasShippingSla(sla: ShippingSla | null | undefined): sla is ShippingSla {
  return sla != null && sla.status !== "NOT_APPLICABLE"
}

/** Verbleibende Millisekunden bis zur Server-Frist (negativ, wenn überschritten). */
export function slaRemainingMs(deadlineAt: string, now: Date = new Date()): number {
  return new Date(deadlineAt).getTime() - now.getTime()
}

/** Kompakte, lokalisierte Restzeit-/Überfällig-Beschriftung für Badges. */
export function formatSlaRemaining(deadlineAt: string, now: Date = new Date()): string {
  const remainingMs = slaRemainingMs(deadlineAt, now)
  if (remainingMs < 0) {
    return SHIPPING_SLA_STATUS_LABEL.BREACHED
  }
  const totalMinutes = Math.floor(remainingMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  if (hours >= 1) {
    return `Versand in ${hours} h`
  }
  return `Versand in ${totalMinutes} min`
}

/**
 * Badge-Text zum Server-Zustand: die laufende Frist als Restzeit, alle übrigen
 * Zustände als festes Label. Ohne `deadlineAt` (theoretisch möglich, da der
 * Vertrag das Feld nullable hält) bleibt es beim Status-Label.
 */
export function shippingSlaBadgeLabel(sla: ShippingSla, now: Date = new Date()): string {
  if (sla.status === "PENDING" && sla.deadlineAt) {
    return formatSlaRemaining(sla.deadlineAt, now)
  }
  return SHIPPING_SLA_STATUS_LABEL[sla.status]
}

/** Deutsche Datums-/Zeitangabe der Frist für das Detail-Banner. */
export function formatSlaDeadline(deadlineAt: string): string {
  return new Date(deadlineAt).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
