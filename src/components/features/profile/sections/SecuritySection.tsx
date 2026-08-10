"use client"

import { Shield, Loader2 } from "lucide-react"
import { Button } from "@/src/components/ui/button"
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
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <SectionHeader
        id="security"
        icon={Shield}
        label="Sicherheit"
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <div className="space-y-4 px-5 pb-5">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium text-foreground">Passwort</p>
              <p className="text-sm text-muted-foreground">Zuletzt geändert vor 3 Monaten</p>
            </div>
            <Button
              variant="outline"
              onClick={onPasswordReset}
              disabled={isSendingPasswordReset}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              {isSendingPasswordReset ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ändern"}
            </Button>
          </div>

          <div className="rounded-lg border border-danger bg-danger-tint p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-danger">Konto löschen</p>
                <p className="text-sm text-danger">
                  Diese Aktion kann nicht rückgängig gemacht werden
                </p>
              </div>
              <Button
                variant="outline"
                onClick={onRequestDelete}
                className="border-danger text-danger hover:bg-danger-tint"
              >
                Löschen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
