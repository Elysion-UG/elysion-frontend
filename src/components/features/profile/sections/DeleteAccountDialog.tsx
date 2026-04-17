"use client"

import { AlertTriangle, Loader2 } from "lucide-react"
import { useFocusTrap } from "@/src/hooks/useFocusTrap"

interface DeleteAccountDialogProps {
  onCancel: () => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteAccountDialog({ onCancel, onConfirm, isDeleting }: DeleteAccountDialogProps) {
  const modalRef = useFocusTrap(onCancel)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex-shrink-0 rounded-lg bg-red-100 p-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 id="delete-dialog-title" className="text-lg font-bold text-stone-800">
              Konto wirklich löschen?
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Durch das Löschen Ihres Kontos werden alle Ihre persönlichen Daten, Bestellungen und
              gespeicherten Adressen unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig
              gemacht werden (Art. 17 DSGVO).
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-stone-300 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Wird gelöscht...
              </>
            ) : (
              "Konto endgültig löschen"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
