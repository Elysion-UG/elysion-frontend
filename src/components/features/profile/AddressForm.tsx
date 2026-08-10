"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useEffectEvent } from "@/src/hooks/use-effect-event"
import { X, Loader2 } from "lucide-react"
import type { Address, AddressDTO, AddressType } from "@/src/types"
import { toCountryCode, toCountryName } from "@/src/lib/country"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"

interface AddressFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dto: AddressDTO) => Promise<void>
  address?: Address | null
}

export default function AddressForm({ isOpen, onClose, onSave, address }: AddressFormProps) {
  const [type, setType] = useState<AddressType>("SHIPPING")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [street, setStreet] = useState("")
  const [houseNumber, setHouseNumber] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("Deutschland")
  const [isDefault, setIsDefault] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const syncFormFromAddress = useEffectEvent(() => {
    if (address) {
      setType(address.type)
      setFirstName(address.firstName)
      setLastName(address.lastName)
      setStreet(address.street)
      setHouseNumber(address.houseNumber)
      setPostalCode(address.postalCode)
      setCity(address.city)
      setCountry(toCountryName(address.country))
      setIsDefault(address.isDefault)
    } else {
      setType("SHIPPING")
      setFirstName("")
      setLastName("")
      setStreet("")
      setHouseNumber("")
      setPostalCode("")
      setCity("")
      setCountry("Deutschland")
      setIsDefault(false)
    }
  })

  useEffect(() => {
    syncFormFromAddress()
  }, [address, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave({
        type,
        firstName,
        lastName,
        street,
        houseNumber,
        postalCode,
        city,
        country: toCountryCode(country),
        isDefault,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const modalRef = useFocusTrap(onClose)

  if (!isOpen) return null

  const labelClass = "block text-sm font-medium text-foreground mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={address ? "Adresse bearbeiten" : "Neue Adresse hinzufügen"}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Schliessen"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            {address ? "Adresse bearbeiten" : "Neue Adresse hinzufügen"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className={labelClass}>Adresstyp</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("SHIPPING")}
                  className={`rounded-lg border-2 py-2 text-sm font-medium transition-colors ${type === "SHIPPING" ? "border-green-600 bg-green-50 text-green-600" : "border-border text-foreground"}`}
                >
                  Lieferadresse
                </button>
                <button
                  type="button"
                  onClick={() => setType("BILLING")}
                  className={`rounded-lg border-2 py-2 text-sm font-medium transition-colors ${type === "BILLING" ? "border-green-600 bg-green-50 text-green-600" : "border-border text-foreground"}`}
                >
                  Rechnungsadresse
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="addr-fn" className={labelClass}>
                  Vorname
                </label>
                <Input
                  id="addr-fn"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <label htmlFor="addr-ln" className={labelClass}>
                  Nachname
                </label>
                <Input
                  id="addr-ln"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div>
                <label htmlFor="addr-street" className={labelClass}>
                  Strasse
                </label>
                <Input
                  id="addr-street"
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <label htmlFor="addr-hn" className={labelClass}>
                  Hausnr.
                </label>
                <Input
                  id="addr-hn"
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div>
                <label htmlFor="addr-plz" className={labelClass}>
                  PLZ
                </label>
                <Input
                  id="addr-plz"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <label htmlFor="addr-city" className={labelClass}>
                  Stadt
                </label>
                <Input
                  id="addr-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="addr-country" className={labelClass}>
                Land
              </label>
              <Input
                id="addr-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-border text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-foreground">Als Standardadresse festlegen</span>
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Speichern...
                  </>
                ) : (
                  "Speichern"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
