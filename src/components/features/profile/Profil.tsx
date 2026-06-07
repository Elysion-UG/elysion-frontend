"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { User } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { AuthService } from "@/src/services/auth.service"
import { UserService } from "@/src/services/user.service"
import { AddressService } from "@/src/services/address.service"
import type { Address } from "@/src/types"
import AddressForm from "@/src/components/features/profile/AddressForm"
import { toast } from "sonner"
import { useUserProfile, useAddresses } from "@/src/hooks/useProfile"
import { useAsyncAction } from "@/src/hooks/useAsyncAction"
import { ProfileSkeleton } from "./sections/ProfileSkeleton"
import { DeleteAccountDialog } from "./sections/DeleteAccountDialog"
import { PersonalDataSection } from "./sections/PersonalDataSection"
import { AddressesSection } from "./sections/AddressesSection"
import { PaymentMethodsSection } from "./sections/PaymentMethodsSection"
import { NotificationsSection } from "./sections/NotificationsSection"
import { SecuritySection } from "./sections/SecuritySection"

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
        <PersonalDataSection
          expanded={expandedSections.personal}
          onToggle={toggleSection}
          email={user?.email ?? ""}
          firstName={firstName}
          lastName={lastName}
          phone={phone}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onPhoneChange={setPhone}
          onSave={handleSaveProfile}
          isSaving={isSavingProfile}
        />

        <AddressesSection
          expanded={expandedSections.address}
          onToggle={toggleSection}
          addresses={addresses}
          isLoading={isLoadingAddresses}
          onEdit={(addr) => {
            setEditingAddress(addr)
            setAddressFormOpen(true)
          }}
          onAdd={() => {
            setEditingAddress(null)
            setAddressFormOpen(true)
          }}
          onDelete={handleDeleteAddress}
          onSetDefault={handleSetDefault}
        />

        <PaymentMethodsSection expanded={expandedSections.payment} onToggle={toggleSection} />

        <NotificationsSection expanded={expandedSections.notifications} onToggle={toggleSection} />

        <SecuritySection
          expanded={expandedSections.security}
          onToggle={toggleSection}
          onPasswordReset={handlePasswordReset}
          isSendingPasswordReset={isSendingPasswordReset}
          onRequestDelete={() => setDeleteDialogOpen(true)}
        />
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
