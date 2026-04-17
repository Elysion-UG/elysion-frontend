"use client"

import { Bell } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

interface NotificationsSectionProps {
  expanded: boolean
  onToggle: (id: string) => void
}

export function NotificationsSection({ expanded, onToggle }: NotificationsSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <SectionHeader
        id="notifications"
        icon={Bell}
        label="Benachrichtigungen"
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <div className="space-y-3 px-5 pb-5">
          <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-center">
            <p className="text-sm font-medium text-stone-700">
              Benachrichtigungseinstellungen folgen in Kürze
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Wichtige Bestell-E-Mails erhalten Sie aktuell automatisch an Ihre hinterlegte Adresse.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
