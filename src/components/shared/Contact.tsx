"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Phone, MapPin, Send, Clock, MessageCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  SUPPORT_EMAIL,
  CONTACT_SUBJECTS,
  contactSubjectLabel,
  buildContactMailto,
  openMailto,
} from "@/src/lib/contact"
import { ApiError } from "@/src/lib/api-client"
import { ContactService } from "@/src/services/contact.service"

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" }

export default function Contact() {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendFailed, setSendFailed] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const ack = await ContactService.send({
        name: formData.name.trim(),
        email: formData.email.trim(),
        // Der lesbare Betreff, nicht der Select-Wert: der Vertrag verlangt
        // 3–150 Zeichen und im Support-Postfach steht sonst nur "order".
        subject: contactSubjectLabel(formData.subject),
        message: formData.message,
      })
      setSendFailed(false)
      setFormData(EMPTY_FORM)
      const reference = ack.id.slice(0, 8)
      if (ack.forwarded) {
        toast.success(`Nachricht eingegangen. Wir antworten per E-Mail. Referenz: ${reference}`)
      } else {
        // Gespeichert ist die Anfrage in jedem Fall — nur die Benachrichtigung an
        // das Support-Postfach ging nicht raus. Ein "wir melden uns gleich" wäre
        // hier geschönt, deshalb die ehrliche Variante samt Referenznummer.
        toast.warning(
          `Nachricht gespeichert (Referenz: ${reference}). Die Benachrichtigung an unser Support-Team steht noch aus — die Antwort kann daher länger dauern.`
        )
      }
    } catch (err) {
      setSendFailed(true)
      // 429 und 400 bringen bereits eine lokalisierte Meldung mit (api-client).
      toast.error(
        err instanceof ApiError
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
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-border px-4 py-3 transition-colors focus:border-green-600 focus:ring-2 focus:ring-green-500"
                    placeholder="Ihr vollständiger Name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-border px-4 py-3 transition-colors focus:border-green-600 focus:ring-2 focus:ring-green-500"
                    placeholder="ihre@email.de"
                  />
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
                  className="w-full rounded-lg border border-border px-4 py-3 transition-colors focus:border-green-600 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Bitte wählen</option>
                  {CONTACT_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
                  Nachricht *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="resize-vertical w-full rounded-lg border border-border px-4 py-3 transition-colors focus:border-green-600 focus:ring-2 focus:ring-green-500"
                  placeholder="Wie können wir Ihnen helfen?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSubmitting ? "Wird gesendet …" : "Nachricht senden"}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Wir speichern Ihre Anfrage und antworten per E-Mail an die angegebene Adresse.
              </p>

              {/* Fallback: schlägt der Endpoint fehl, bleibt der Kontaktweg offen. */}
              {sendFailed && (
                <div className="rounded-lg bg-secondary p-4 text-center text-sm text-foreground">
                  <p>Das Senden hat nicht geklappt.</p>
                  <button
                    type="button"
                    onClick={() => openMailto(buildContactMailto(formData))}
                    className="mt-2 font-medium text-green-600 underline underline-offset-2"
                  >
                    Stattdessen E-Mail-Programm öffnen
                  </button>
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
