"use client"

import { useState, useEffect } from "react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import { useQueryClient } from "@tanstack/react-query"
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
import { AuthService } from "@/src/services/auth.service"
import { UserService } from "@/src/services/user.service"
import { AddressService } from "@/src/services/address.service"
import type { Address } from "@/src/types"
import AddressForm from "@/src/components/features/profile/AddressForm"
import { toast } from "sonner"
import { toCountryName } from "@/src/lib/country"
import { useUserProfile, useAddresses } from "@/src/hooks/useProfile"
import { useAsyncAction } from "@/src/hooks/useAsyncAction"

interface SectionHeaderProps {
  id: string
  icon: React.ElementType
  label: string
  expanded: boolean
  onToggle: (id: string) => void
}

function SectionHeader({ id, icon: Icon, label, expanded, onToggle }: SectionHeaderProps) {
  return (
    <button
      onClick={() => onToggle(id)}
      className="flex w-full items-center justify-between p-5 transition-colors hover:bg-stone-50"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-sage-100 p-2">
          <Icon className="h-5 w-5 text-sage-600" />
        </div>
        <span className="text-lg font-semibold text-stone-800">{label}</span>
      </div>
      {expanded ? (
        <ChevronDown className="h-5 w-5 text-stone-400" />
      ) : (
        <ChevronRight className="h-5 w-5 text-stone-400" />
      )}
    </button>
  )
}

function DeleteAccountDialog({
  onCancel,
  onConfirm,
  isDeleting,
}: {
  onCancel: () => void
  onConfirm: () => void
  isDeleting: boolean
}) {
  const modalRef = useFocusTrap(onCancel)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex-shrink-0 rounded-lg bg-red-100 p-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 id="delete-dialog-title" className="text-lg font-bold text-stone-800">
              Konto wirklich löschen?
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Durch das Löschen Ihres Kontos werden alle Ihre persönlichen Daten, Bestellungen und
              gespeicherten Adressen unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig
              gemacht werden (Art. 17 DSGVO).
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-stone-300 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? (
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
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="mb-2 h-9 w-44 animate-pulse rounded bg-stone-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-stone-200" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-sage-100" />
                <div className="h-5 w-36 animate-pulse rounded bg-stone-200" />
              </div>
              <div className="h-5 w-5 animate-pulse rounded bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Profil() {
  const queryClient = useQueryClient()
  const { user, setUser, logout } = useAuth()

  const { data: profileData, isLoading: isLoadingProfile } = useUserProfile()
  const { data: addresses = [], isLoading: isLoadingAddresses } = useAddresses()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")

  const [addressFormOpen, setAddressFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    address: false,
    payment: false,
    notifications: false,
    security: false,
  })

  const { isLoading: isSavingProfile, execute: executeProfileSave } = useAsyncAction()
  const { isLoading: isSendingPasswordReset, execute: executePasswordReset } = useAsyncAction()
  const { isLoading: isDeletingAccount, execute: executeDeleteAccount } = useAsyncAction()

  useEffect(() => {
    if (!profileData) return
    // Hydrate form state from fetched profile — user may still edit fields afterwards.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFirstName(profileData.firstName ?? "")
    setLastName(profileData.lastName ?? "")
    setPhone(profileData.phone ?? "")
  }, [profileData])

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSaveProfile = () =>
    executeProfileSave(
      async () => {
        const updated = await UserService.updateProfile({ firstName, lastName, phone })
        setUser({
          ...user!,
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone,
        })
        await queryClient.invalidateQueries({ queryKey: ["profile"] })
        toast.success("Profil gespeichert!")
      },
      { errorMessage: "Fehler beim Speichern." }
    )

  const handleSaveAddress = async (dto: Parameters<typeof AddressService.create>[0]) => {
    try {
      if (editingAddress) {
        await AddressService.update(editingAddress.id, dto)
        toast.success("Adresse aktualisiert!")
      } else {
        await AddressService.create(dto)
        toast.success("Adresse hinzugefügt!")
      }
      await queryClient.invalidateQueries({ queryKey: ["addresses"] })
      setEditingAddress(null)
    } catch {
      toast.error("Fehler beim Speichern der Adresse.")
    }
  }

  const handleDeleteAddress = (id: string) =>
    executeProfileSave(
      async () => {
        await AddressService.remove(id)
        await queryClient.invalidateQueries({ queryKey: ["addresses"] })
        toast.success("Adresse gelöscht.")
      },
      { errorMessage: "Fehler beim Löschen." }
    )

  const handleSetDefault = (id: string) =>
    executeProfileSave(
      async () => {
        await AddressService.setDefault(id)
        await queryClient.invalidateQueries({ queryKey: ["addresses"] })
        toast.success("Standardadresse gesetzt.")
      },
      { errorMessage: "Fehler." }
    )

  const handlePasswordReset = () => {
    if (!user?.email) return
    executePasswordReset(
      async () => {
        await AuthService.forgotPassword(user.email)
        toast.success("Reset-E-Mail wurde gesendet. Bitte überprüfen Sie Ihr Postfach.")
      },
      { errorMessage: "Fehler beim Senden der Reset-E-Mail." }
    )
  }

  const handleDeleteAccount = () =>
    executeDeleteAccount(async () => {
      await UserService.deleteAccount()
      await logout()
      toast.success("Konto wurde gelöscht.")
      window.location.href = "/"
    })

  if (isLoadingProfile && !profileData) {
    return <ProfileSkeleton />
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage-100">
          <User className="h-6 w-6 text-sage-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Mein Profil</h1>
          <p className="text-sm text-stone-500">Persönliche Daten und Einstellungen verwalten</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Persönliche Daten */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <SectionHeader
            id="personal"
            icon={User}
            label="Persönliche Daten"
            expanded={expandedSections.personal}
            onToggle={toggleSection}
          />
          {expandedSections.personal && (
            <div className="space-y-4 px-5 pb-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">Vorname</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-sage-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-600">Nachname</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-sage-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-600">
                  E-Mail <span className="text-stone-400">(nicht änderbar)</span>
                </label>
                <input
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-stone-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-600">Telefon</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="mt-2 flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sage-700 disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Speichern...
                  </>
                ) : (
                  "Änderungen speichern"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Adressen */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <SectionHeader
            id="address"
            icon={MapPin}
            label="Liefer- & Adresseinstellungen"
            expanded={expandedSections.address}
            onToggle={toggleSection}
          />
          {expandedSections.address && (
            <div className="space-y-4 px-5 pb-5">
              {isLoadingAddresses && addresses.length === 0 ? (
                <div className="space-y-3 py-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-stone-100" />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <p className="py-4 text-center text-sm text-stone-500">Keine Adressen vorhanden.</p>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="relative rounded-lg border border-stone-200 p-4">
                    {addr.isDefault && (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-sage-100 px-2 py-0.5 text-xs text-sage-700">
                        <Star className="h-3 w-3" /> Standard
                      </span>
                    )}
                    <p className="font-medium text-stone-800">
                      {addr.firstName} {addr.lastName}
                    </p>
                    <p className="text-sm text-stone-600">
                      {addr.street} {addr.houseNumber}
                    </p>
                    <p className="text-sm text-stone-600">
                      {addr.postalCode} {addr.city}
                    </p>
                    <p className="text-sm text-stone-600">{toCountryName(addr.country)}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      {addr.type === "SHIPPING" ? "Lieferadresse" : "Rechnungsadresse"}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditingAddress(addr)
                          setAddressFormOpen(true)
                        }}
                        className="flex items-center gap-1 text-sm text-sage-600 hover:text-sage-700"
                      >
                        <Edit2 className="h-3 w-3" /> Bearbeiten
                      </button>
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="flex items-center gap-1 text-sm text-stone-600 hover:text-sage-700"
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
                className="flex items-center gap-2 text-sm font-medium text-sage-600 hover:text-sage-700"
              >
                <Plus className="h-4 w-4" /> Neue Adresse hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Zahlungsmethoden */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <SectionHeader
            id="payment"
            icon={CreditCard}
            label="Zahlungsmethoden"
            expanded={expandedSections.payment}
            onToggle={toggleSection}
          />
          {expandedSections.payment && (
            <div className="space-y-3 px-5 pb-5">
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-center">
                <p className="text-sm font-medium text-stone-700">
                  Gespeicherte Zahlungsmethoden folgen in Kürze
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Aktuell werden Zahlungen pro Bestellung im Checkout ausgewählt.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Benachrichtigungen */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <SectionHeader
            id="notifications"
            icon={Bell}
            label="Benachrichtigungen"
            expanded={expandedSections.notifications}
            onToggle={toggleSection}
          />
          {expandedSections.notifications && (
            <div className="space-y-3 px-5 pb-5">
              <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-center">
                <p className="text-sm font-medium text-stone-700">
                  Benachrichtigungseinstellungen folgen in Kürze
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Wichtige Bestell-E-Mails erhalten Sie aktuell automatisch an Ihre hinterlegte
                  Adresse.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sicherheit */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <SectionHeader
            id="security"
            icon={Shield}
            label="Sicherheit"
            expanded={expandedSections.security}
            onToggle={toggleSection}
          />
          {expandedSections.security && (
            <div className="space-y-4 px-5 pb-5">
              <div className="flex items-center justify-between rounded-lg border border-stone-200 p-4">
                <div>
                  <p className="font-medium text-stone-800">Passwort</p>
                  <p className="text-sm text-stone-500">Zuletzt geändert vor 3 Monaten</p>
                </div>
                <button
                  onClick={handlePasswordReset}
                  disabled={isSendingPasswordReset}
                  className="flex items-center gap-2 rounded-lg border border-sage-600 px-4 py-2 text-sm text-sage-600 transition-colors hover:bg-sage-50 disabled:opacity-50"
                >
                  {isSendingPasswordReset ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ändern"}
                </button>
              </div>

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

      <AddressForm
        isOpen={addressFormOpen}
        onClose={() => {
          setAddressFormOpen(false)
          setEditingAddress(null)
        }}
        onSave={handleSaveAddress}
        address={editingAddress}
      />

      {deleteDialogOpen && (
        <DeleteAccountDialog
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            setDeleteDialogOpen(false)
            handleDeleteAccount()
          }}
          isDeleting={isDeletingAccount}
        />
      )}
    </div>
  )
}
