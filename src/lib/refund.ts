/**
 * refund.ts — Betragsvalidierung und Fehler-Texte für Erstattungen (#56).
 *
 * Die Obergrenze einer Erstattung ist immer der **Restbetrag der
 * Abrechnungszeile** (`grossAmount - refundedAmount`, Backend
 * `OrderGroupSettlement.remainingRefundableAmountCents`). Das Backend prüft das
 * verbindlich; diese Vorprüfung existiert nur, damit ein offensichtlich
 * unmöglicher Betrag gar nicht erst als `400` zurückkommt.
 *
 * Gerechnet wird durchgehend in **Cent**: `24.90 - 24.90 > 0` ist in Float-
 * Arithmetik wahr, in Cent nicht. Auf die Leitung geht der Betrag danach wieder
 * als Decimal EUR — so schreibt es der Vertrag vor (`docs/api/refunds.md`).
 */
import { ApiError } from "@/src/lib/api-client"
import { euroToCents, formatEuro } from "@/src/lib/currency"

/** Restbetrag einer Abrechnungszeile in EUR — nie negativ. */
export function remainingRefundable(settlement: {
  grossAmount: number
  refundedAmount?: number
}): number {
  const remainingCents =
    euroToCents(settlement.grossAmount) - euroToCents(settlement.refundedAmount ?? 0)
  return Math.max(0, remainingCents) / 100
}

export type RefundAmountValidation =
  /** Vollerstattung — `amount` bleibt im Request weg, das Backend nimmt den Restbetrag. */
  { ok: true; amount: undefined } | { ok: true; amount: number } | { ok: false; error: string }

export interface RefundAmountInput {
  /** `"full"` schickt keinen Betrag mit, `"partial"` validiert `value`. */
  mode: "full" | "partial"
  /** Roheingabe aus dem Formular; deutsche Kommaschreibweise ist erlaubt. */
  value?: string
  /**
   * Noch erstattbarer Restbetrag in EUR. `null` = dem Client unbekannt
   * (z. B. Admin-Eskalation ohne geladene Abrechnungszeile) — dann bleibt die
   * Obergrenze allein Sache des Servers.
   */
  remaining: number | null
}

/**
 * Prüft den eingegebenen Erstattungsbetrag gegen den offenen Restbetrag.
 *
 * Abgewiesen wird: leere Eingabe, keine Zahl, ≤ 0, mehr als zwei
 * Nachkommastellen und alles über dem Restbetrag — dieselben Fälle, die das
 * Backend mit `400` beantwortet.
 */
export function validateRefundAmount({
  mode,
  value,
  remaining,
}: RefundAmountInput): RefundAmountValidation {
  if (remaining !== null && euroToCents(remaining) <= 0) {
    return { ok: false, error: "Für diese Bestellung ist nichts mehr erstattbar." }
  }

  if (mode === "full") {
    return { ok: true, amount: undefined }
  }

  const raw = (value ?? "").trim().replace(",", ".")
  if (raw.length === 0) {
    return { ok: false, error: "Bitte einen Betrag eingeben." }
  }
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    return { ok: false, error: "Bitte einen gültigen Betrag eingeben (z. B. 24,90)." }
  }

  const decimals = raw.split(".")[1] ?? ""
  if (decimals.length > 2) {
    return { ok: false, error: "Höchstens zwei Nachkommastellen." }
  }

  const amount = Number(raw)
  if (!Number.isFinite(amount)) {
    return { ok: false, error: "Bitte einen gültigen Betrag eingeben (z. B. 24,90)." }
  }

  const amountCents = euroToCents(amount)
  if (amountCents <= 0) {
    return { ok: false, error: "Der Betrag muss größer als 0 € sein." }
  }
  if (remaining !== null && amountCents > euroToCents(remaining)) {
    return {
      ok: false,
      error: `Höchstens ${formatEuro(remaining)} sind noch erstattbar.`,
    }
  }

  return { ok: true, amount: amountCents / 100 }
}

/** Maximale Länge des Grundes laut Vertrag (`@Size(max = 500)`). */
export const REFUND_REASON_MAX_LENGTH = 500

/**
 * Übersetzt einen fehlgeschlagenen Erstattungs-Request in eine Meldung nach dem
 * Kommunikationsprinzip (§1.9): **Instanz benennen + konkrete Konsequenz**.
 *
 * Ausgewertet wird ausschließlich der Statuscode bzw. `data.error` — nie der
 * Message-String (`docs/architecture/error-codes.md`).
 */
export function refundErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return (
      "Die Erstattung konnte nicht ausgeführt werden (Elysion). " +
      "Es wurde nichts erstattet — bitte in einem Moment erneut versuchen."
    )
  }

  switch (err.status) {
    case 400:
      return (
        "Der Betrag ist ungültig oder höher als der offene Restbetrag (Eingabe). " +
        "Es wurde nichts erstattet — bitte Betrag prüfen und erneut versuchen."
      )
    case 403:
      return (
        "Für diese Bestellung besteht keine Berechtigung zur Erstattung (Zugriff verweigert). " +
        "Es wurde nichts erstattet."
      )
    case 404:
      return (
        "Zu dieser Bestellung existiert keine Abrechnungszeile (Elysion). " +
        "Es wurde nichts erstattet — bitte den Support hinzuziehen."
      )
    case 409:
      return (
        "Die Bestellung ist bereits vollständig erstattet oder die Zahlung ist derzeit nicht " +
        "erstattbar (Eingabe). Es wurde nichts gebucht — bitte den Stand aktualisieren."
      )
    case 502:
    case 503:
      return (
        "Der Zahlungsdienstleister antwortet gerade nicht. " +
        "Es wurde nichts erstattet — bitte später erneut versuchen."
      )
    default:
      return (
        "Die Erstattung konnte nicht ausgeführt werden (Elysion). " +
        "Es wurde nichts erstattet — bitte in einem Moment erneut versuchen."
      )
  }
}
