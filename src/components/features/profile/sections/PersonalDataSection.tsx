"use client"

import { User, Loader2 } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { SectionHeader } from "./SectionHeader"

interface PersonalDataSectionProps {
  expanded: boolean
  onToggle: (id: string) => void
  email: string
  firstName: string
  lastName: string
  phone: string
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onSave: () => void
  isSaving: boolean
}

export function PersonalDataSection({
  expanded,
  onToggle,
  email,
  firstName,
  lastName,
  phone,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onSave,
  isSaving,
}: PersonalDataSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <SectionHeader
        id="personal"
        icon={User}
        label="Persönliche Daten"
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <div className="space-y-4 px-5 pb-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Vorname</label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Nachname</label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              E-Mail <span className="text-muted-foreground">(nicht änderbar)</span>
            </label>
            <Input
              type="email"
              value={email}
              disabled
              className="bg-secondary text-muted-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Telefon</label>
            <Input type="tel" value={phone} onChange={(e) => onPhoneChange(e.target.value)} />
          </div>
          <Button onClick={onSave} disabled={isSaving} className="mt-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Speichern...
              </>
            ) : (
              "Änderungen speichern"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
