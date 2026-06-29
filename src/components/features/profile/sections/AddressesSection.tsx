"use client"

import { MapPin, Plus, Edit2, Trash2, Star } from "lucide-react"
import type { Address } from "@/src/types"
import { toCountryName } from "@/src/lib/country"
import { SectionHeader } from "./SectionHeader"

interface AddressesSectionProps {
  expanded: boolean
  onToggle: (id: string) => void
  addresses: Address[]
  isLoading: boolean
  onEdit: (address: Address) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

export function AddressesSection({
  expanded,
  onToggle,
  addresses,
  isLoading,
  onEdit,
  onAdd,
  onDelete,
  onSetDefault,
}: AddressesSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <SectionHeader
        id="address"
        icon={MapPin}
        label="Liefer- & Adresseinstellungen"
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <div className="space-y-4 px-5 pb-5">
          {isLoading && addresses.length === 0 ? (
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
                    onClick={() => onEdit(addr)}
                    className="flex items-center gap-1 text-sm text-sage-600 hover:text-sage-700"
                  >
                    <Edit2 className="h-3 w-3" /> Bearbeiten
                  </button>
                  {!addr.isDefault && (
                    <button
                      onClick={() => onSetDefault(addr.id)}
                      className="flex items-center gap-1 text-sm text-stone-600 hover:text-sage-700"
                    >
                      <Star className="h-3 w-3" /> Als Standard
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(addr.id)}
                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" /> Löschen
                  </button>
                </div>
              </div>
            ))
          )}
          <button
            onClick={onAdd}
            className="flex items-center gap-2 text-sm font-medium text-sage-600 hover:text-sage-700"
          >
            <Plus className="h-4 w-4" /> Neue Adresse hinzufügen
          </button>
        </div>
      )}
    </div>
  )
}
