"use client"

import { ChevronRight, Loader2, MapPin } from "lucide-react"
import type { Address } from "@/src/types"

interface AddressStepProps {
  addresses: Address[]
  selectedAddressId: string | null
  onSelect: (id: string) => void
  onContinue: () => void
  isLoading: boolean
}

export function AddressStep({
  addresses,
  selectedAddressId,
  onSelect,
  onContinue,
  isLoading,
}: AddressStepProps) {
  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <h1 className="mb-8 flex items-center gap-3 text-3xl font-bold text-slate-800">
        <MapPin className="h-8 w-8 text-teal-600" />
        Lieferadresse
      </h1>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="mb-4 text-yellow-800">Du hast noch keine gespeicherte Adresse.</p>
          <a href="/profil" className="font-medium text-teal-700 underline underline-offset-2">
            Adresse in Profil hinzufügen
          </a>
        </div>
      ) : (
        <div className="mb-8 space-y-3">
          {addresses.map((addr) => (
            <label
              key={addr.id}
              className={`block cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                selectedAddressId === addr.id
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={() => onSelect(addr.id)}
                  className="mt-1 accent-teal-600"
                />
                <div className="text-sm leading-relaxed text-slate-700">
                  <p className="font-medium">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p>
                    {addr.street} {addr.houseNumber}
                  </p>
                  <p>
                    {addr.postalCode} {addr.city}
                  </p>
                  {addr.isDefault && (
                    <span className="text-xs font-medium text-teal-600">Standardadresse</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      <button
        onClick={onContinue}
        disabled={isLoading || !selectedAddressId}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Weiter zur Übersicht <ChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  )
}
