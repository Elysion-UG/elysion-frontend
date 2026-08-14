"use client"

import type React from "react"

import { useState } from "react"
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  MessageCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import {
  SUPPORT_EMAIL,
  CONTACT_SUBJECTS,
  CONTACT_LIMITS,
  contactSubjectLabel,
  validateContactForm,
  buildContactMailto,
  openMailto,
  type ContactFieldErrors,
} from "@/src/lib/contact"
import { ApiError } from "@/src/lib/api-client"
import { ContactService, type ContactAcknowledgement } from "@/src/services/contact.service"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" }

// Für <select> gibt es kein Primitive — die Feld-Optik von <Input> steht hier
// deshalb von Hand (Guide 03: Radius 12, Hairline, 3-px-Grün-Fokusring).
const FIELD_BASE =
  "h-11 w-full rounded-xl border-[1.5px] bg-card px-4 py-2 text-base transition-[color,border-color,box-shadow] duration-200 ease-brand focus-visible:border-green-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-green-500/40 md:text-sm"

function fieldClass(hasError: boolean): string {
  return `${FIELD_BASE} ${hasError ? "border-danger" : "border-input"}`
}

/** Fehlerkontur für <Input>/<Textarea> — sonst gilt die Kontur des Primitives. */
function errorBorder(hasError: boolean): string | undefined {
  return hasError ? "border-danger" : undefined
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-danger">
      {message}
    </p>
  )
}

export default function Contact() {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendFailed, setSendFailed] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  // Die Quittung bleibt stehen, bis erneut gesendet wird: im Fall
  // `forwarded: false` ist die Referenznummer der einzige Beleg, dass die
  // Nachricht überlebt hat — die darf nicht mit einem Toast verschwinden.
  const [acknowledgement, setAcknowledgement] = useState<ContactAcknowledgement | null>(null)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Die Meldung verschwindet, sobald das Feld angefasst wird — sie soll auf
    // den Fehler hinweisen, nicht beim Beheben im Weg stehen.
    setFieldErrors((prev) =>
      prev[name as keyof ContactFieldErrors] ? { ...prev, [name]: undefined } : prev
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    // Erst prüfen, dann senden: ein 400 des Endpoints käme als englisches
    // "Validation failed" ohne Feldbezug zurück.
    const errors = validateContactForm(formData)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast.error("Bitte prüfen Sie die markierten Felder.")
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)
    try {
      const ack = await ContactService.send({
        name: formData.name.trim(),
        email: formData.email.trim(),
        // Der lesbare Betreff, nicht der Select-Wert: der Vertrag verlangt
        // 3–150 Zeichen und im Support-Postfach steht sonst nur "order".
        subject: contactSubjectLabel(formData.subject),
        message: formData.message.trim(),
      })
      setSendFailed(false)
      setFormData(EMPTY_FORM)
      setAcknowledgement(ack)
      if (ack.forwarded) {
        toast.success("Nachricht eingegangen. Wir antworten per E-Mail.")
      } else {
        // Gespeichert ist die Anfrage in jedem Fall — nur die Benachrichtigung an
        // das Support-Postfach ging nicht raus. Ein "wir melden uns gleich" wäre
        // hier geschönt, deshalb die ehrliche Variante.
        toast.warning(
          "Nachricht gespeichert — die Benachrichtigung an unser Support-Team steht noch aus."
        )
      }
    } catch (err) {
      setSendFailed(true)
      setAcknowledgement(null)
      // Lokalisiert ist im api-client nur der 429-Fall; jede andere Meldung
      // kommt wörtlich vom Server, deshalb der neutrale deutsche Fallback.
      toast.error(
        err instanceof ApiError && err.status === 429
          ? err.message
          : "Nachricht konnte nicht gesendet werden. Bitte später erneut versuchen."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-normal text-foreground">Kontakt</h1>
          <p className="mx-auto max-w-2xl text-xl text-foreground">
            Haben Sie Fragen zu nachhaltigen Produkten oder brauchen Sie Hilfe bei Ihrer Bestellung?
            Wir helfen Ihnen gerne weiter.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-2xl font-bold text-foreground">Kontaktinformationen</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">E-Mail</h3>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-foreground decoration-green-500 underline-offset-2 hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">Telefon</h3>
                    <p className="text-foreground">[PLATZHALTER: +49 ...]</p>
                    <p className="text-sm text-muted-foreground">Mo–Fr, 9:00–18:00 Uhr</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">Adresse</h3>
                    <p className="text-foreground">[PLATZHALTER: Straße und Hausnummer]</p>
                    <p className="text-foreground">[PLATZHALTER: PLZ Stadt]</p>
                    <p className="text-foreground">Deutschland</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Clock className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-foreground">Öffnungszeiten</h3>
              </div>
              <div className="space-y-2 text-foreground">
                <div className="flex justify-between">
                  <span>Montag – Freitag</span>
                  <span>9:00 – 18:00 Uhr</span>
                </div>
                <div className="flex justify-between">
                  <span>Samstag</span>
                  <span>10:00 – 14:00 Uhr</span>
                </div>
                <div className="flex justify-between">
                  <span>Sonntag</span>
                  <span>Geschlossen</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-foreground">Schnelle Antworten</h3>
              </div>
              <p className="mb-4 text-foreground">
                Häufige Fragen zu Bestellungen, Rücksendungen und Nachhaltigkeit beantworten wir
                gerne direkt über das Kontaktformular.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Nachricht senden</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                    Vollständiger Name *
                  </label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    minLength={CONTACT_LIMITS.name.min}
                    maxLength={CONTACT_LIMITS.name.max}
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? "name-error" : undefined}
                    className={errorBorder(Boolean(fieldErrors.name))}
                    placeholder="Ihr vollständiger Name"
                  />
                  <FieldError id="name-error" message={fieldErrors.name} />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                    E-Mail-Adresse *
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    maxLength={CONTACT_LIMITS.email.max}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                    className={errorBorder(Boolean(fieldErrors.email))}
                    placeholder="ihre@email.de"
                  />
                  <FieldError id="email-error" message={fieldErrors.email} />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-medium text-foreground">
                  Betreff *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  aria-invalid={Boolean(fieldErrors.subject)}
                  aria-describedby={fieldErrors.subject ? "subject-error" : undefined}
                  className={fieldClass(Boolean(fieldErrors.subject))}
                >
                  <option value="">Bitte wählen</option>
                  {CONTACT_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <FieldError id="subject-error" message={fieldErrors.subject} />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
                  Nachricht *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  minLength={CONTACT_LIMITS.message.min}
                  maxLength={CONTACT_LIMITS.message.max}
                  rows={6}
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={fieldErrors.message ? "message-error" : undefined}
                  className={`resize-vertical ${errorBorder(Boolean(fieldErrors.message)) ?? ""}`}
                  placeholder="Wie können wir Ihnen helfen?"
                />
                <FieldError id="message-error" message={fieldErrors.message} />
              </div>

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSubmitting ? "Wird gesendet …" : "Nachricht senden"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Wir speichern Ihre Anfrage und antworten per E-Mail an die angegebene Adresse.
              </p>

              {/*
                Bleibende Quittung mit der vollständigen Referenznummer. Ein Toast
                allein reicht nicht: er ist nach wenigen Sekunden weg, und bei
                `forwarded: false` ist die Referenz der einzige Beleg, dass die
                Nachricht gespeichert wurde. Abgeschnitten darf sie auch nicht
                sein — der Support sucht darauf per Gleichheit.
              */}
              {acknowledgement && (
                <div
                  role="status"
                  className={`rounded-lg p-4 text-sm ${
                    acknowledgement.forwarded
                      ? "bg-green-50 text-foreground"
                      : "bg-warning-tint text-foreground"
                  }`}
                >
                  <p className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    {acknowledgement.forwarded
                      ? "Nachricht eingegangen — wir antworten per E-Mail."
                      : "Nachricht gespeichert."}
                  </p>
                  {!acknowledgement.forwarded && (
                    <p className="mt-2 text-muted-foreground">
                      Die Benachrichtigung an unser Support-Team steht noch aus, die Antwort kann
                      daher länger dauern. Ihre Anfrage ist gespeichert und geht nicht verloren.
                    </p>
                  )}
                  <p className="mt-2 text-muted-foreground">
                    Referenznummer:{" "}
                    <code className="select-all break-all font-mono text-xs text-foreground">
                      {acknowledgement.id}
                    </code>
                  </p>
                </div>
              )}

              {/* Fallback: schlägt der Endpoint fehl, bleibt der Kontaktweg offen. */}
              {sendFailed && (
                <div className="rounded-lg bg-secondary p-4 text-center text-sm text-foreground">
                  <p>Das Senden hat nicht geklappt.</p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => openMailto(buildContactMailto(formData))}
                    className="mt-2 h-auto px-0 text-green-600 underline underline-offset-2"
                  >
                    Stattdessen E-Mail-Programm öffnen
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Oder schreiben Sie direkt an {SUPPORT_EMAIL}.
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
