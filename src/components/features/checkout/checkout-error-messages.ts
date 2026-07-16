/**
 * Checkout- & Payment-Fehlermeldungen nach dem Kommunikationsprinzip
 * (MANAGEMENT_DECISIONS.md §1.9, 2026-06-10):
 *
 *   1. Nur kommunizieren, wenn dem Kunden ein Nachteil über unsere Versprechen
 *      hinaus entsteht — transiente/interne Fehler ohne Kundennachteil werden
 *      still behandelt/retryt, nicht alarmierend gesurfacet.
 *   2. Wird kommuniziert, dann offen: WELCHE INSTANZ (Kunde, Elysion/Plattform,
 *      Seller, Zahlungsdienstleister) den Fehler verursacht hat + die KONKRETE
 *      KONSEQUENZ für den Kunden (was ist passiert, was ist zu tun).
 *
 * Bis die Backend-Fehler-Attribution (#147) verfügbar ist, mappt das Frontend
 * die bekannten Fälle. Alle Meldungen benennen die Instanz und die Konsequenz.
 */

// ── Checkout (Bestellanlage, vor jeder Zahlung) ──────────────────────────────

/** Gespeicherte Adressen konnten nicht geladen werden (Plattform, transient). */
export const CHECKOUT_ADDRESS_LOAD_ERROR =
  "Wir konnten deine gespeicherten Adressen gerade nicht laden (Elysion). " +
  "Es wurde nichts bestellt oder belastet — bitte lade die Seite in einem Moment neu."

/** Vorprüfung (Preview) fehlgeschlagen — es wird noch nichts verbindlich. */
export const CHECKOUT_PREVIEW_ERROR =
  "Wir konnten deine Bestellung gerade nicht vorprüfen (Elysion). " +
  "Es wurde nichts bestellt oder belastet — bitte versuche es in einem Moment erneut."

/** Bestellabschluss fehlgeschlagen — Zahlung wurde noch nicht ausgelöst. */
export const CHECKOUT_COMPLETE_ERROR =
  "Deine Bestellung konnte nicht abgeschlossen werden (Elysion). " +
  "Es wurde noch keine Zahlung ausgelöst und nichts belastet — bitte versuche es erneut."

// ── Payment (Zahlungsdienstleister) ──────────────────────────────────────────

/**
 * Ein von Stripe (Zahlungsdienstleister) gemeldeter Fehler beim Bestätigen der
 * Zahlung. Stripes eigene Meldung ist bereits instanz-genau und lokalisiert
 * (z. B. „Ihre Karte wurde abgelehnt.") — wir übernehmen sie und ergänzen die
 * Konsequenz. Fehlt sie, nennen wir Instanz + Konsequenz generisch.
 */
export function paymentConfirmError(stripeMessage?: string | null): string {
  const base =
    stripeMessage && stripeMessage.trim().length > 0
      ? stripeMessage.trim()
      : "Die Zahlung konnte nicht bestätigt werden (Zahlungsdienstleister)."
  return `${base} Es wurde nichts belastet — bitte versuche es erneut oder nutze eine andere Zahlungsmethode.`
}

/** Zahlung wurde vom Dienstleister abgelehnt/abgebrochen (FAILED/CANCELLED). */
export const PAYMENT_DECLINED_ERROR =
  "Die Zahlung wurde vom Zahlungsdienstleister nicht abgeschlossen. " +
  "Es wurde nichts belastet — bitte versuche es erneut oder nutze eine andere Zahlungsmethode."

/** Zahlungsvorgang konnte gar nicht erst gestartet werden (Intent-Anlage). */
export const PAYMENT_INIT_ERROR =
  "Der Zahlungsvorgang konnte nicht gestartet werden (Elysion). " +
  "Es wurde nichts belastet — bitte versuche es in einem Moment erneut."
