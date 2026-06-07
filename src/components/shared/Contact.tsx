"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Phone, MapPin, Send, Clock, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { SUPPORT_EMAIL, CONTACT_SUBJECTS, buildContactMailto, openMailto } from "@/src/lib/contact"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // No backend contact endpoint yet — open the user's mail client with the
    // message prefilled. Honest and fully client-side until an endpoint exists.
    openMailto(buildContactMailto(formData))
    toast.success(
      `Ihr E-Mail-Programm wurde geöffnet. Falls das nicht klappt, schreiben Sie an ${SUPPORT_EMAIL}.`
    )
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
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-sage-600 underline-offset-2 hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
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
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-stone-700">
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
                <label htmlFor="subject" className="mb-2 block text-sm font-medium text-stone-700">
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
                  {CONTACT_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-stone-700">
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-bark-700 px-6 py-3 font-medium text-white transition-colors hover:bg-bark-800"
              >
                <Send className="h-4 w-4" />
                Nachricht per E-Mail senden
              </button>

              <p className="text-center text-xs text-stone-500">
                Der Button öffnet Ihr E-Mail-Programm mit der vorausgefüllten Nachricht.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
