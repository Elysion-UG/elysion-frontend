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

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
    setIsSubmitting(true)

    try {
      // TODO: echten API-Endpunkt für Kontaktformular anbinden
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSubmitted(true)
      setFormData({ name: "", email: "", subject: "", message: "" })
      toast.success("Ihre Nachricht wurde gesendet. Wir melden uns bald!")
    } catch {
      toast.error("Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-stone-800">Kontakt</h1>
          <p className="mx-auto max-w-2xl text-xl text-sage-600">
            Haben Sie Fragen zu nachhaltigen Produkten oder brauchen Sie Hilfe bei Ihrer Bestellung?
            Wir helfen Ihnen gerne weiter.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-2xl font-bold text-stone-800">Kontaktinformationen</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-sage-50">
                    <Mail className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-stone-800">E-Mail</h3>
                    <p className="text-sage-600">[PLATZHALTER: support@elysion.de]</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-sage-50">
                    <Phone className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-stone-800">Telefon</h3>
                    <p className="text-sage-600">[PLATZHALTER: +49 ...]</p>
                    <p className="text-sm text-sage-600">Mo–Fr, 9:00–18:00 Uhr</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-sage-50">
                    <MapPin className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-stone-800">Adresse</h3>
                    <p className="text-sage-600">[PLATZHALTER: Straße und Hausnummer]</p>
                    <p className="text-sage-600">[PLATZHALTER: PLZ Stadt]</p>
                    <p className="text-sage-600">Deutschland</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Clock className="h-6 w-6 text-sage-600" />
                <h3 className="text-lg font-semibold text-stone-800">Öffnungszeiten</h3>
              </div>
              <div className="space-y-2 text-stone-700">
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

            <div className="rounded-lg bg-sage-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-sage-600" />
                <h3 className="text-lg font-semibold text-stone-800">Schnelle Antworten</h3>
              </div>
              <p className="mb-4 text-stone-700">
                Häufige Fragen zu Bestellungen, Rücksendungen und Nachhaltigkeit beantworten wir
                gerne direkt über das Kontaktformular.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-stone-800">Nachricht senden</h2>

            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-sage-500" />
                <p className="text-lg font-semibold text-stone-800">
                  Vielen Dank für Ihre Nachricht!
                </p>
                <p className="text-stone-600">Wir melden uns schnellstmöglich bei Ihnen zurück.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-sm text-sage-600 underline hover:text-sage-800"
                >
                  Weitere Nachricht senden
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-stone-700">
                      Vollständiger Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-stone-200 px-4 py-3 transition-colors focus:border-sage-500 focus:ring-2 focus:ring-sage-100"
                      placeholder="Ihr vollständiger Name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-stone-700"
                    >
                      E-Mail-Adresse *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-stone-200 px-4 py-3 transition-colors focus:border-sage-500 focus:ring-2 focus:ring-sage-100"
                      placeholder="ihre@email.de"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Betreff *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-stone-200 px-4 py-3 transition-colors focus:border-sage-500 focus:ring-2 focus:ring-sage-100"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="general">Allgemeine Anfrage</option>
                    <option value="order">Hilfe bei einer Bestellung</option>
                    <option value="product">Produktfrage</option>
                    <option value="sustainability">Nachhaltigkeit & Zertifizierungen</option>
                    <option value="seller">Als Verkäufer bewerben</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-medium text-stone-700"
                  >
                    Nachricht *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="resize-vertical w-full rounded-lg border border-stone-200 px-4 py-3 transition-colors focus:border-sage-500 focus:ring-2 focus:ring-sage-100"
                    placeholder="Wie können wir Ihnen helfen?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-bark-700 px-6 py-3 font-medium text-white transition-colors hover:bg-bark-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Nachricht senden
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
