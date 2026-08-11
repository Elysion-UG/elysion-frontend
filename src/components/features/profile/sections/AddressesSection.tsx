"use client"

import { MapPin, Plus, Edit2, Trash2, Star } from "lucide-react"
import type { Address } from "@/src/types"
import { toCountryName } from "@/src/lib/country"
import { ADDRESS_TYPE_LABEL } from "@/src/lib/constants"
import { Button } from "@/src/components/ui/button"
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
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
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
                <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Keine Adressen vorhanden.
            </p>
          ) : (
            addresses.map((addr) => (
              <div key={addr.id} className="relative rounded-lg border border-border p-4">
                {addr.isDefault && (
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs text-ink-900">
                    <Star className="h-3 w-3" /> Standard
                  </span>
                )}
                <p className="font-medium text-foreground">
                  {addr.firstName} {addr.lastName}
                </p>
                <p className="text-sm text-foreground">
                  {addr.street} {addr.houseNumber}
                </p>
                <p className="text-sm text-foreground">
                  {addr.postalCode} {addr.city}
                </p>
                <p className="text-sm text-foreground">{toCountryName(addr.country)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ADDRESS_TYPE_LABEL[addr.type]}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    variant="link"
                    onClick={() => onEdit(addr)}
                    className="h-auto gap-1 p-0 text-green-600"
                  >
                    <Edit2 className="h-3 w-3" /> Bearbeiten
                  </Button>
                  {!addr.isDefault && (
                    <Button
                      variant="link"
                      onClick={() => onSetDefault(addr.id)}
                      className="h-auto gap-1 p-0 hover:text-green-600"
                    >
                      <Star className="h-3 w-3" /> Als Standard
                    </Button>
                  )}
                  <Button
                    variant="link"
                    onClick={() => onDelete(addr.id)}
                    className="h-auto gap-1 p-0 text-danger"
                  >
                    <Trash2 className="h-3 w-3" /> Löschen
                  </Button>
                </div>
              </div>
            ))
          )}
          <Button variant="link" onClick={onAdd} className="h-auto p-0 text-green-600">
            <Plus className="h-4 w-4" /> Neue Adresse hinzufügen
          </Button>
        </div>
      )}
    </div>
  )
}
