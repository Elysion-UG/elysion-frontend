"use client"

import { useState, useEffect } from "react"
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Star,
  Loader2,
  AlertTriangle,
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
      setUser({
        ...user!,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
      })
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

  const SectionHeader = ({
    id,
    icon: Icon,
    label,
  }: {
    id: string
    icon: typeof User
    label: string
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="flex w-full items-center justify-between p-5 transition-colors hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-teal-100 p-2">
          <Icon className="h-5 w-5 text-teal-600" />
        </div>
        <span className="text-lg font-semibold text-slate-800">{label}</span>
      </div>
      {expandedSections[id] ? (
        <ChevronDown className="h-5 w-5 text-slate-400" />
      ) : (
        <ChevronRight className="h-5 w-5 text-slate-400" />
      )}
    </button>
  )

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-slate-800">Mein Profil</h1>
        <p className="text-slate-600">Verwalten Sie Ihre persönlichen Daten und Einstellungen.</p>
      </div>

      <div className="space-y-4">
        {/* Persönliche Daten */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SectionHeader id="personal" icon={User} label="Persönliche Daten" />
          {expandedSections.personal && (
            <div className="space-y-4 px-5 pb-5">
              {isLoadingProfile ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        Vorname
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        Nachname
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      E-Mail <span className="text-slate-400">(nicht änderbar)</span>
                    </label>
                    <input
                      type="email"
                      value={user?.email ?? ""}
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Telefon</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="mt-2 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Speichern...
                      </>
                    ) : (
                      "Änderungen speichern"
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Adressen */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SectionHeader id="address" icon={MapPin} label="Liefer- & Adresseinstellungen" />
          {expandedSections.address && (
            <div className="space-y-4 px-5 pb-5">
              {isLoadingAddresses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
              ) : addresses.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">Keine Adressen vorhanden.</p>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="relative rounded-lg border border-slate-200 p-4">
                    {addr.isDefault && (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-teal-100 px-2 py-0.5 text-xs text-teal-700">
                        <Star className="h-3 w-3" /> Standard
                      </span>
                    )}
                    <p className="font-medium text-slate-800">
                      {addr.firstName} {addr.lastName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {addr.street} {addr.houseNumber}
                    </p>
                    <p className="text-sm text-slate-600">
                      {addr.postalCode} {addr.city}
                    </p>
                    <p className="text-sm text-slate-600">{addr.country}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {addr.type === "SHIPPING" ? "Lieferadresse" : "Rechnungsadresse"}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditingAddress(addr)
                          setAddressFormOpen(true)
                        }}
                        className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                      >
                        <Edit2 className="h-3 w-3" /> Bearbeiten
                      </button>
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="flex items-center gap-1 text-sm text-slate-600 hover:text-teal-700"
                        >
                          <Star className="h-3 w-3" /> Als Standard
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" /> Löschen
                      </button>
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={() => {
                  setEditingAddress(null)
                  setAddressFormOpen(true)
                }}
                className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                <Plus className="h-4 w-4" /> Neue Adresse hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Zahlungsmethoden */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SectionHeader id="payment" icon={CreditCard} label="Zahlungsmethoden" />
          {expandedSections.payment && (
            <div className="space-y-4 px-5 pb-5">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-12 items-center justify-center rounded bg-slate-800 text-xs font-bold text-white">
                    VISA
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{"•••• •••• •••• 4242"}</p>
                    <p className="text-sm text-slate-500">Gültig bis 12/26</p>
                  </div>
                </div>
                <span className="rounded bg-teal-100 px-2 py-0.5 text-xs text-teal-700">
                  Standard
                </span>
              </div>
              <button className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700">
                <Plus className="h-4 w-4" /> Zahlungsmethode hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Benachrichtigungen */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SectionHeader id="notifications" icon={Bell} label="Benachrichtigungen" />
          {expandedSections.notifications && (
            <div className="space-y-4 px-5 pb-5">
              {[
                {
                  label: "E-Mail Benachrichtigungen",
                  desc: "Bestellbestätigungen und Updates",
                  defaultOn: true,
                },
                { label: "Newsletter", desc: "Angebote und neue Produkte", defaultOn: false },
                {
                  label: "Push-Benachrichtigungen",
                  desc: "Echtzeit-Updates im Browser",
                  defaultOn: true,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-slate-800">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      defaultChecked={item.defaultOn}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sicherheit */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SectionHeader id="security" icon={Shield} label="Sicherheit" />
          {expandedSections.security && (
            <div className="space-y-4 px-5 pb-5">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-800">Passwort</p>
                  <p className="text-sm text-slate-500">Zuletzt geändert vor 3 Monaten</p>
                </div>
                <button className="rounded-lg border border-teal-600 px-4 py-2 text-sm text-teal-600 transition-colors hover:bg-teal-50">
                  Ändern
                </button>
              </div>

              {/* Delete Account */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-800">Konto löschen</p>
                    <p className="text-sm text-red-600">
                      Diese Aktion kann nicht rückgängig gemacht werden
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteDialogOpen(true)}
                    className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100"
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
        onClose={() => {
          setAddressFormOpen(false)
          setEditingAddress(null)
        }}
        onSave={handleSaveAddress}
        address={editingAddress}
      />

      {/* Delete Account Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex-shrink-0 rounded-lg bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Konto wirklich löschen?</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Durch das Löschen Ihres Kontos werden alle Ihre persönlichen Daten, Bestellungen
                  und gespeicherten Adressen unwiderruflich gelöscht. Diese Aktion kann nicht
                  rückgängig gemacht werden (Art. 17 DSGVO).
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Wird gelöscht...
                  </>
                ) : (
                  "Konto endgültig löschen"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
