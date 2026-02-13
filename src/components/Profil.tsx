"use client"

import { useState } from "react"
import { User, MapPin, CreditCard, Bell, Shield, ChevronDown, ChevronRight, Plus, Edit2 } from "lucide-react"

export default function Profil() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    address: false,
    payment: false,
    notifications: false,
    security: false,
  })

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Mein Profil</h1>
        <p className="text-slate-600">Verwalten Sie Ihre persönlichen Daten und Einstellungen.</p>
      </div>

      <div className="space-y-4">
        {/* Persönliche Daten */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection("personal")}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-lg font-semibold text-slate-800">Persönliche Daten</span>
            </div>
            {expandedSections.personal ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {expandedSections.personal && (
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Vorname</label>
                  <input
                    type="text"
                    defaultValue="Max"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Nachname</label>
                  <input
                    type="text"
                    defaultValue="Mustermann"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">E-Mail</label>
                <input
                  type="email"
                  defaultValue="max.mustermann@email.de"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Telefon</label>
                <input
                  type="tel"
                  defaultValue="+49 123 456789"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                Änderungen speichern
              </button>
            </div>
          )}
        </div>

        {/* Liefer- & Adresseinstellungen */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection("address")}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-lg font-semibold text-slate-800">Liefer- & Adresseinstellungen</span>
            </div>
            {expandedSections.address ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {expandedSections.address && (
            <div className="px-5 pb-5 space-y-4">
              {/* Address Card */}
              <div className="p-4 border border-slate-200 rounded-lg relative">
                <span className="absolute top-2 right-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                  Standard
                </span>
                <p className="font-medium text-slate-800">Max Mustermann</p>
                <p className="text-slate-600 text-sm">Musterstraße 123</p>
                <p className="text-slate-600 text-sm">12345 Musterstadt</p>
                <p className="text-slate-600 text-sm">Deutschland</p>
                <button className="mt-3 text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" /> Bearbeiten
                </button>
              </div>

              {/* Second Address */}
              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="font-medium text-slate-800">Max Mustermann (Büro)</p>
                <p className="text-slate-600 text-sm">Firmenstraße 45</p>
                <p className="text-slate-600 text-sm">54321 Arbeitsstadt</p>
                <p className="text-slate-600 text-sm">Deutschland</p>
                <button className="mt-3 text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" /> Bearbeiten
                </button>
              </div>

              <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium">
                <Plus className="w-4 h-4" /> Neue Adresse hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Zahlungsmethoden */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection("payment")}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-lg font-semibold text-slate-800">Zahlungsmethoden</span>
            </div>
            {expandedSections.payment ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {expandedSections.payment && (
            <div className="px-5 pb-5 space-y-4">
              {/* Payment Card */}
              <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">•••• •••• •••• 4242</p>
                    <p className="text-slate-500 text-sm">Gültig bis 12/26</p>
                  </div>
                </div>
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">Standard</span>
              </div>

              {/* PayPal */}
              <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    PP
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">PayPal</p>
                    <p className="text-slate-500 text-sm">max.mustermann@email.de</p>
                  </div>
                </div>
              </div>

              <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium">
                <Plus className="w-4 h-4" /> Zahlungsmethode hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Benachrichtigungen */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection("notifications")}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Bell className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-lg font-semibold text-slate-800">Benachrichtigungen</span>
            </div>
            {expandedSections.notifications ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {expandedSections.notifications && (
            <div className="px-5 pb-5 space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-slate-800">E-Mail Benachrichtigungen</p>
                  <p className="text-sm text-slate-500">Bestellbestätigungen und Updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-slate-800">Newsletter</p>
                  <p className="text-sm text-slate-500">Angebote und neue Produkte</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-slate-800">Push-Benachrichtigungen</p>
                  <p className="text-sm text-slate-500">Echtzeit-Updates im Browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Sicherheit */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection("security")}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Shield className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-lg font-semibold text-slate-800">Sicherheit</span>
            </div>
            {expandedSections.security ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {expandedSections.security && (
            <div className="px-5 pb-5 space-y-4">
              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Passwort</p>
                    <p className="text-sm text-slate-500">Zuletzt geändert vor 3 Monaten</p>
                  </div>
                  <button className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors">
                    Ändern
                  </button>
                </div>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Zwei-Faktor-Authentifizierung</p>
                    <p className="text-sm text-slate-500">Zusätzliche Sicherheit für Ihr Konto</p>
                  </div>
                  <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                    Aktivieren
                  </button>
                </div>
              </div>

              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-800">Konto löschen</p>
                    <p className="text-sm text-red-600">Diese Aktion kann nicht rückgängig gemacht werden</p>
                  </div>
                  <button className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
