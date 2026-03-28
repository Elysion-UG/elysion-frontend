"use client"

import { useState, useEffect } from "react"
import {
  User, MapPin, CreditCard, Bell, Shield, ChevronDown, ChevronRight,
  Plus, Edit2, Trash2, Star, Loader2, AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { UserService } from "@/src/services/user.service"
import { AddressService } from "@/src/services/address.service"
import type { Address } from "@/src/types"
import AddressForm from "@/src/components/features/profile/AddressForm"
import { toast } from "sonner"

export default function Profil() {
  const { user, setUser, logout } = useAuth()

  // Profile state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // Sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    address: false,
    payment: false,
    notifications: false,
    security: false,
  })

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Populate form from AuthContext user (already loaded on app start)
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "")
      setLastName(user.lastName ?? "")
      setPhone(user.phone ?? "")
    }
    setIsLoadingProfile(false)
  }, [user])

  // Load addresses
  useEffect(() => {
    async function load() {
      try {
        const addrs = await AddressService.getAll()
        setAddresses(addrs)
      } catch {
        toast.error("Adressen konnten nicht geladen werden.")
      } finally {
        setIsLoadingAddresses(false)
      }
    }
    load()
  }, [])

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const updated = await UserService.updateProfile({ firstName, lastName, phone })
      setUser({ ...user!, firstName: updated.firstName, lastName: updated.lastName, phone: updated.phone })
      toast.success("Profil gespeichert!")
    } catch {
      toast.error("Fehler beim Speichern.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveAddress = async (dto: Parameters<typeof AddressService.create>[0]) => {
    try {
      if (editingAddress) {
        await AddressService.update(editingAddress.id, dto)
        toast.success("Adresse aktualisiert!")
      } else {
        await AddressService.create(dto)
        toast.success("Adresse hinzugefügt!")
      }
      const addrs = await AddressService.getAll()
      setAddresses(addrs)
      setEditingAddress(null)
    } catch {
      toast.error("Fehler beim Speichern der Adresse.")
    }
  }

  const handleDeleteAddress = async (id: string) => {
    try {
      await AddressService.remove(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      toast.success("Adresse gelöscht.")
    } catch {
      toast.error("Fehler beim Löschen.")
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await AddressService.setDefault(id)
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
      toast.success("Standardadresse gesetzt.")
    } catch {
      toast.error("Fehler.")
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      await UserService.deleteAccount()
      await logout()
      toast.success("Konto wurde gelöscht.")
      window.location.href = "/"
    } catch {
      toast.error("Fehler beim Löschen des Kontos.")
    } finally {
      setIsDeletingAccount(false)
      setDeleteDialogOpen(false)
    }
  }

  const SectionHeader = ({ id, icon: Icon, label }: { id: string; icon: typeof User; label: string }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-100 rounded-lg">
          <Icon className="w-5 h-5 text-teal-600" />
        </div>
        <span className="text-lg font-semibold text-slate-800">{label}</span>
      </div>
      {expandedSections[id] ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
    </button>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Mein Profil</h1>
        <p className="text-slate-600">Verwalten Sie Ihre persönlichen Daten und Einstellungen.</p>
      </div>

      <div className="space-y-4">
        {/* Persönliche Daten */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader id="personal" icon={User} label="Persönliche Daten" />
          {expandedSections.personal && (
            <div className="px-5 pb-5 space-y-4">
              {isLoadingProfile ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-teal-600 animate-spin" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Vorname</label>
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Nachname</label>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">E-Mail <span className="text-slate-400">(nicht änderbar)</span></label>
                    <input type="email" value={user?.email ?? ""} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Telefon</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800" />
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    {isSavingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> Speichern...</> : "Änderungen speichern"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Adressen */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader id="address" icon={MapPin} label="Liefer- & Adresseinstellungen" />
          {expandedSections.address && (
            <div className="px-5 pb-5 space-y-4">
              {isLoadingAddresses ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-teal-600 animate-spin" /></div>
              ) : addresses.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Keine Adressen vorhanden.</p>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="p-4 border border-slate-200 rounded-lg relative">
                    {addr.isDefault && (
                      <span className="absolute top-2 right-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <Star className="w-3 h-3" /> Standard
                      </span>
                    )}
                    <p className="font-medium text-slate-800">{addr.firstName} {addr.lastName}</p>
                    <p className="text-slate-600 text-sm">{addr.street} {addr.houseNumber}</p>
                    <p className="text-slate-600 text-sm">{addr.postalCode} {addr.city}</p>
                    <p className="text-slate-600 text-sm">{addr.country}</p>
                    <p className="text-xs text-slate-400 mt-1">{addr.type === "SHIPPING" ? "Lieferadresse" : "Rechnungsadresse"}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => { setEditingAddress(addr); setAddressFormOpen(true) }}
                        className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Bearbeiten
                      </button>
                      {!addr.isDefault && (
                        <button onClick={() => handleSetDefault(addr.id)} className="text-sm text-slate-600 hover:text-teal-700 flex items-center gap-1">
                          <Star className="w-3 h-3" /> Als Standard
                        </button>
                      )}
                      <button onClick={() => handleDeleteAddress(addr.id)} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Löschen
                      </button>
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={() => { setEditingAddress(null); setAddressFormOpen(true) }}
                className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
              >
                <Plus className="w-4 h-4" /> Neue Adresse hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Zahlungsmethoden */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader id="payment" icon={CreditCard} label="Zahlungsmethoden" />
          {expandedSections.payment && (
            <div className="px-5 pb-5 space-y-4">
              <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                  <div>
                    <p className="font-medium text-slate-800">{"•••• •••• •••• 4242"}</p>
                    <p className="text-slate-500 text-sm">Gültig bis 12/26</p>
                  </div>
                </div>
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">Standard</span>
              </div>
              <button className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm">
                <Plus className="w-4 h-4" /> Zahlungsmethode hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Benachrichtigungen */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader id="notifications" icon={Bell} label="Benachrichtigungen" />
          {expandedSections.notifications && (
            <div className="px-5 pb-5 space-y-4">
              {[
                { label: "E-Mail Benachrichtigungen", desc: "Bestellbestätigungen und Updates", defaultOn: true },
                { label: "Newsletter", desc: "Angebote und neue Produkte", defaultOn: false },
                { label: "Push-Benachrichtigungen", desc: "Echtzeit-Updates im Browser", defaultOn: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-slate-800">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.defaultOn} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sicherheit */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <SectionHeader id="security" icon={Shield} label="Sicherheit" />
          {expandedSections.security && (
            <div className="px-5 pb-5 space-y-4">
              <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Passwort</p>
                  <p className="text-sm text-slate-500">Zuletzt geändert vor 3 Monaten</p>
                </div>
                <button className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors text-sm">
                  Ändern
                </button>
              </div>

              {/* Delete Account */}
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-800">Konto löschen</p>
                    <p className="text-sm text-red-600">Diese Aktion kann nicht rückgängig gemacht werden</p>
                  </div>
                  <button
                    onClick={() => setDeleteDialogOpen(true)}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address Form Modal */}
      <AddressForm
        isOpen={addressFormOpen}
        onClose={() => { setAddressFormOpen(false); setEditingAddress(null) }}
        onSave={handleSaveAddress}
        address={editingAddress}
      />

      {/* Delete Account Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Konto wirklich löschen?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Durch das Löschen Ihres Kontos werden alle Ihre persönlichen Daten, Bestellungen und gespeicherten Adressen unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden (Art. 17 DSGVO).
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {isDeletingAccount ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird gelöscht...</> : "Konto endgültig löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
