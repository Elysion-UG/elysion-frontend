// Contact configuration and mailto helper.
//
// Das Formular sendet an `POST /api/v1/contact` (ContactService, Backend #120).
// Der `mailto:`-Weg bleibt als **Fallback**: schlägt der Request fehl — Netzfehler,
// Rate-Limit, Server nicht erreichbar —, bietet `Contact.tsx` an, die Nachricht
// stattdessen im Mail-Programm zu öffnen. Ohne diesen Ausweg stünde ausgerechnet
// bei einer Störung kein Kontaktweg zur Verfügung.
// Die Support-Adresse ist über NEXT_PUBLIC_SUPPORT_EMAIL konfigurierbar.

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@elysion.de"

export interface ContactSubject {
  value: string
  label: string
}

export const CONTACT_SUBJECTS: ContactSubject[] = [
  { value: "general", label: "Allgemeine Anfrage" },
  { value: "order", label: "Hilfe bei einer Bestellung" },
  { value: "product", label: "Produktfrage" },
  { value: "sustainability", label: "Nachhaltigkeit & Zertifizierungen" },
  { value: "seller", label: "Als Verkäufer bewerben" },
  { value: "feedback", label: "Feedback" },
]

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

/**
 * Übersetzt den Select-Wert in den lesbaren Betreff. Genau dieser Text geht an
 * den Endpoint: der Backend-Vertrag verlangt 3–150 Zeichen, und im
 * Support-Postfach steht dann „Hilfe bei einer Bestellung" statt `order`.
 * Unbekannte Werte fallen auf "Anfrage" zurück.
 */
export function contactSubjectLabel(value: string): string {
  return CONTACT_SUBJECTS.find((s) => s.value === value)?.label ?? "Anfrage"
}

/**
 * Grenzen aus dem Backend-Vertrag (#120, `docs/api/contact.md`). Sie entsprechen
 * exakt den Spaltenbreiten von `contact_messages` und sind zugleich der
 * Missbrauchsdeckel des unauthentifizierten Endpoints.
 */
export const CONTACT_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 320 },
  subject: { min: 3, max: 150 },
  message: { min: 10, max: 5000 },
} as const

export interface ContactFieldErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

/**
 * Prüft die Eingaben gegen dieselben Grenzen wie der Endpoint — **bevor** der
 * Request rausgeht.
 *
 * Ohne diese Prüfung antwortet der `GlobalExceptionHandler` mit dem wörtlichen
 * „Validation failed", das der api-client bei `400` unverändert durchreicht
 * (lokalisiert wird im api-client nur der `429`-Fall). Der Besucher bekäme also
 * eine englische Meldung ohne Feldbezug — gegenüber dem früheren `mailto:`, das
 * nie etwas abgelehnt hat, wäre das ein Rückschritt.
 *
 * Gemessen wird auf dem getrimmten Wert, weil der Endpoint `btrim`-leere Felder
 * ohnehin ablehnt.
 */
export function validateContactForm(data: ContactFormData): ContactFieldErrors {
  const errors: ContactFieldErrors = {}

  const name = data.name.trim()
  if (name.length < CONTACT_LIMITS.name.min) {
    errors.name = `Bitte geben Sie Ihren Namen an (mindestens ${CONTACT_LIMITS.name.min} Zeichen).`
  } else if (name.length > CONTACT_LIMITS.name.max) {
    errors.name = `Der Name darf höchstens ${CONTACT_LIMITS.name.max} Zeichen lang sein.`
  }

  const email = data.email.trim()
  if (email.length === 0) {
    errors.email = "Bitte geben Sie Ihre E-Mail-Adresse an."
  } else if (email.length > CONTACT_LIMITS.email.max) {
    errors.email = `Die E-Mail-Adresse darf höchstens ${CONTACT_LIMITS.email.max} Zeichen lang sein.`
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // `\s` schließt CR/LF mit ein: der Endpoint lehnt Steuerzeichen in der
    // Adresse hart ab (Header-Injection-Versuch), das fangen wir hier schon.
    errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse an."
  }

  // Der Betreff kommt aus einem Select — geprüft wird, dass überhaupt gewählt
  // wurde. Dass jedes Label in 3–150 Zeichen passt, sichert der Test über
  // CONTACT_SUBJECTS ab, nicht eine hier unerreichbare Laufzeitprüfung.
  if (!data.subject.trim()) {
    errors.subject = "Bitte wählen Sie einen Betreff."
  }

  const message = data.message.trim()
  if (message.length < CONTACT_LIMITS.message.min) {
    errors.message = `Bitte beschreiben Sie Ihr Anliegen (mindestens ${CONTACT_LIMITS.message.min} Zeichen).`
  } else if (message.length > CONTACT_LIMITS.message.max) {
    errors.message = `Die Nachricht darf höchstens ${CONTACT_LIMITS.message.max} Zeichen lang sein.`
  }

  return errors
}

/**
 * Builds a `mailto:` URL from the contact form data — Fallback-Weg, wenn der
 * Endpoint nicht erreichbar ist. The subject value is mapped to its
 * human-readable label; unknown values fall back to "Anfrage".
 */
export function buildContactMailto(
  data: ContactFormData,
  supportEmail: string = SUPPORT_EMAIL
): string {
  const subject = `[Elysion Kontakt] ${contactSubjectLabel(data.subject)}`
  const body = `Name: ${data.name}\nE-Mail: ${data.email}\n\n${data.message}`

  return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** Opens a mailto link in the user's mail client. Extracted for testability. */
export function openMailto(href: string): void {
  if (typeof window !== "undefined") {
    window.location.href = href
  }
}
