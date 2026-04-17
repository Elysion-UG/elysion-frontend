"use client"

import { Shield, Loader2 } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

interface SecuritySectionProps {
  expanded: boolean
  onToggle: (id: string) => void
  onPasswordReset: () => void
  isSendingPasswordReset: boolean
  onRequestDelete: () => void
}

export function SecuritySection({
  expanded,
  onToggle,
  onPasswordReset,
  isSendingPasswordReset,
  onRequestDelete,
}: SecuritySectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <SectionHeader
        id="security"
        icon={Shield}
        label="Sicherheit"
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <div className="space-y-4 px-5 pb-5">
          <div className="flex items-center justify-between rounded-lg border border-stone-200 p-4">
            <div>
              <p className="font-medium text-stone-800">Passwort</p>
              <p className="text-sm text-stone-500">Zuletzt geändert vor 3 Monaten</p>
            </div>
            <button
              onClick={onPasswordReset}
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
                onClick={onRequestDelete}
                className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
