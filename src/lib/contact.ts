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
