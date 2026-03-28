"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import type { Address, AddressDTO, AddressType } from "@/src/types"

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

  useEffect(() => {
    if (address) {
      setType(address.type)
      setFirstName(address.firstName)
      setLastName(address.lastName)
      setStreet(address.street)
      setHouseNumber(address.houseNumber)
      setPostalCode(address.postalCode)
      setCity(address.city)
      setCountry(address.country)
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
        country,
        isDefault,
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const inputClass =
    "w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 text-sm"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="Schliessen"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-slate-800">
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
                  className={`rounded-lg border-2 py-2 text-sm font-medium transition-colors ${type === "SHIPPING" ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600"}`}
                >
                  Lieferadresse
                </button>
                <button
                  type="button"
                  onClick={() => setType("BILLING")}
                  className={`rounded-lg border-2 py-2 text-sm font-medium transition-colors ${type === "BILLING" ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600"}`}
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
                <input
                  id="addr-fn"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="addr-ln" className={labelClass}>
                  Nachname
                </label>
                <input
                  id="addr-ln"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div>
                <label htmlFor="addr-street" className={labelClass}>
                  Strasse
                </label>
                <input
                  id="addr-street"
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="addr-hn" className={labelClass}>
                  Hausnr.
                </label>
                <input
                  id="addr-hn"
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div>
                <label htmlFor="addr-plz" className={labelClass}>
                  PLZ
                </label>
                <input
                  id="addr-plz"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="addr-city" className={labelClass}>
                  Stadt
                </label>
                <input
                  id="addr-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="addr-country" className={labelClass}>
                Land
              </label>
              <input
                id="addr-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700">Als Standardadresse festlegen</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Speichern...
                  </>
                ) : (
                  "Speichern"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
