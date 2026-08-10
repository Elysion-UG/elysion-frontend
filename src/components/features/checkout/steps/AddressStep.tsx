"use client"

import Link from "next/link"
import { ChevronRight, Loader2, MapPin } from "lucide-react"
import { Button } from "@/src/components/ui/button"
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
      <h1 className="mb-8 flex items-center gap-3 text-3xl font-normal text-foreground">
        <MapPin className="h-8 w-8 text-green-600" />
        Lieferadresse
      </h1>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-warning bg-warning-tint p-6 text-center">
          <p className="mb-4 text-ink-900">Du hast noch keine gespeicherte Adresse.</p>
          <Link href="/profil" className="font-medium text-green-600 underline underline-offset-2">
            Adresse in Profil hinzufügen
          </Link>
        </div>
      ) : (
        <div className="mb-8 space-y-3">
          {addresses.map((addr) => (
            <label
              key={addr.id}
              className={`block cursor-pointer rounded-xl border-2 p-4 transition-colors ${
                selectedAddressId === addr.id
                  ? "border-green-600 bg-green-50"
                  : "border-border bg-white hover:border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={() => onSelect(addr.id)}
                  className="mt-1 accent-green-500"
                />
                <div className="text-sm leading-relaxed text-foreground">
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
                    <span className="text-xs font-medium text-muted-foreground">
                      Standardadresse
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      <Button
        size="lg"
        onClick={onContinue}
        disabled={isLoading || !selectedAddressId}
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Weiter zur Übersicht <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}
