/**
 * order-duplicate.ts — Anzeige- und Entscheidungslogik der Duplicate-Review.
 *
 * Bewusst frei von React und vom API-Client, damit die Regeln, an denen ein
 * Fehlurteil teuer wird (offen vs. entschieden, „wie sicher ist der Treffer"),
 * ohne Rendering testbar bleiben.
 */
import type {
  OrderDuplicateFlag,
  OrderDuplicateOrderRef,
  OrderDuplicateResolution,
} from "@/src/types"

/** Backend-Grenze: `note` ist auf 500 Zeichen validiert. */
export const DUPLICATE_NOTE_MAX_LENGTH = 500

export const DUPLICATE_RESOLUTION_LABEL: Record<OrderDuplicateResolution, string> = {
  RELEASED: "Freigegeben",
  CANCELLED_REFUNDED: "Storniert & erstattet",
}

export const DUPLICATE_RESOLUTION_COLOR: Record<OrderDuplicateResolution, string> = {
  RELEASED: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  CANCELLED_REFUNDED: "bg-destructive/40 text-danger ring-1 ring-danger/40",
}

/**
 * Ist der Fall entschieden?
 *
 * Einzig zulässiger Test ist `status` (gleichwertig: `resolution !== null`, eine
 * DB-Check-Constraint hält beide synchron). `resolutionNote` und `resolvedBy`
 * dürfen **nicht** dafür herhalten: die Notiz ist optional, und `resolvedBy`
 * fällt auf `null` zurück, sobald das Admin-Konto gelöscht wird — beides würde
 * entschiedene Fälle wieder als offen anzeigen.
 */
export function isDuplicateDecided(flag: Pick<OrderDuplicateFlag, "status">): boolean {
  return flag.status === "RESOLVED"
}

/** Nur offene Fälle dürfen entschieden werden — erneutes Entscheiden ist entweder No-op oder 409. */
export function canDecideDuplicate(flag: Pick<OrderDuplicateFlag, "status">): boolean {
  return !isDuplicateDecided(flag)
}

export interface DuplicateDecisionInput {
  resolution: OrderDuplicateResolution | null
  note: string
}

export type DuplicateDecisionValidation =
  | { valid: true; payload: { resolution: OrderDuplicateResolution; note?: string } }
  | { valid: false; error: string }

/**
 * Prüft die Eingabe des Reviewers, bevor sie ans Backend geht.
 *
 * Die Notiz wird getrimmt und leer weggelassen statt als `""` gesendet — das
 * Backend speichert Blank ohnehin als `null`, und ein weggelassenes Feld hält
 * die Payload ehrlich.
 */
export function validateDuplicateDecision(
  input: DuplicateDecisionInput
): DuplicateDecisionValidation {
  if (!input.resolution) {
    return { valid: false, error: "Bitte eine Entscheidung auswählen." }
  }
  const note = input.note.trim()
  if (note.length > DUPLICATE_NOTE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Die Begründung darf höchstens ${DUPLICATE_NOTE_MAX_LENGTH} Zeichen haben.`,
    }
  }
  return {
    valid: true,
    payload: note ? { resolution: input.resolution, note } : { resolution: input.resolution },
  }
}

/**
 * Wie stark spricht der zeitliche Abstand für ein Versehen?
 *
 * Der Scan flaggt bis 30 Minuten Abstand; innerhalb dieser Spanne ist der
 * Abstand das einzige Merkmal, das ein Versehen von einer echten Nachbestellung
 * unterscheidet — 40 Sekunden ist so gut wie sicher ein Doppelklick, 25 Minuten
 * eher eine bewusste zweite Bestellung. Die Einstufung ist eine Lesehilfe, nicht
 * die Entscheidung.
 */
export type DuplicateConfidence = "HIGH" | "MEDIUM" | "LOW"

export function duplicateConfidence(secondsApart: number): DuplicateConfidence {
  if (secondsApart <= 120) return "HIGH"
  if (secondsApart <= 600) return "MEDIUM"
  return "LOW"
}

export const DUPLICATE_CONFIDENCE_LABEL: Record<DuplicateConfidence, string> = {
  HIGH: "sehr wahrscheinlich Duplikat",
  MEDIUM: "unklar",
  LOW: "eher Nachbestellung",
}

export const DUPLICATE_CONFIDENCE_COLOR: Record<DuplicateConfidence, string> = {
  HIGH: "bg-destructive/40 text-danger ring-1 ring-danger/40",
  MEDIUM: "bg-warning/40 text-warning ring-1 ring-warning/40",
  LOW: "bg-muted/40 text-muted-foreground ring-1 ring-border/40",
}

/** Sekundenabstand als kurze deutsche Angabe, z. B. `40 Sek.` oder `12 Min. 5 Sek.`. */
export function formatSecondsApart(secondsApart: number): string {
  const seconds = Math.max(0, Math.round(secondsApart))
  if (seconds < 60) return `${seconds} Sek.`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} Min.` : `${minutes} Min. ${rest} Sek.`
}

/**
 * Wen die Bestellung betrifft: Gast-E-Mail, sonst die (gekürzte) User-Id.
 * Beide Bestellungen eines Flags teilen dieselbe E-Mail — daher genügt eine.
 */
export function duplicateBuyerLabel(flag: OrderDuplicateFlag): string {
  const ref = flag.order.guestEmail || flag.order.userId ? flag.order : flag.duplicateOf
  return ref.guestEmail ?? (ref.userId ? `User ${ref.userId.slice(0, 8)}` : "–")
}

/** Bestellnummer, mit Id-Fallback für Stubs ohne geladene Bestellung. */
export function orderRefLabel(ref: OrderDuplicateOrderRef): string {
  return ref.orderNumber ?? ref.id.slice(0, 8)
}

/** Signatur auf Sichtlänge kürzen — 64 Hex-Zeichen sprengen jede Tabellenzelle. */
export function shortMatchSignature(signature: string): string {
  return signature.length <= 12 ? signature : `${signature.slice(0, 12)}…`
}
