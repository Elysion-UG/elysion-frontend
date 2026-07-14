"use client"

import { User, Loader2 } from "lucide-react"
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
              <input
                type="text"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Nachname</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              E-Mail <span className="text-muted-foreground">(nicht änderbar)</span>
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-border bg-secondary px-3 py-2 text-muted-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="mt-2 flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? (
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
  )
}
