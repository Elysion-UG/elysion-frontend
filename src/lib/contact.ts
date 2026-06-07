// Contact configuration and mailto helper.
//
// There is no backend contact endpoint. Until one exists, the contact form
// composes a `mailto:` link to the support address and opens the user's mail
// client. The support address is configurable via NEXT_PUBLIC_SUPPORT_EMAIL.

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
 * Builds a `mailto:` URL from the contact form data. The subject value is
 * mapped to its human-readable label; unknown values fall back to "Anfrage".
 */
export function buildContactMailto(
  data: ContactFormData,
  supportEmail: string = SUPPORT_EMAIL
): string {
  const subjectLabel = CONTACT_SUBJECTS.find((s) => s.value === data.subject)?.label ?? "Anfrage"
  const subject = `[Elysion Kontakt] ${subjectLabel}`
  const body = `Name: ${data.name}\nE-Mail: ${data.email}\n\n${data.message}`

  return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** Opens a mailto link in the user's mail client. Extracted for testability. */
export function openMailto(href: string): void {
  if (typeof window !== "undefined") {
    window.location.href = href
  }
}
