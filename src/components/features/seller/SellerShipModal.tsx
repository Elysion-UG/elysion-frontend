"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { SellerOrderService } from "@/src/services/seller-order.service"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog"
import { toast } from "sonner"

export interface SellerShipModalProps {
  groupId: string
  onClose: () => void
  onDone: () => void
}

export default function SellerShipModal({ groupId, onClose, onDone }: SellerShipModalProps) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Bitte Trackingnummer eingeben.")
      return
    }
    setIsSaving(true)
    try {
      await SellerOrderService.ship(groupId, { trackingNumber, carrier })
      toast.success("Als versandt markiert.")
      onDone()
    } catch {
      toast.error("Fehler beim Versenden.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-xl bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-800">Versanddetails</DialogTitle>
          <DialogDescription className="sr-only">Versandinformationen eingeben</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Trackingnummer *
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="z.B. 1Z999AA10123456784"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Versanddienstleister
            </label>
            <input
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="z.B. DHL, UPS, DPD"
            />
          </div>
        </div>
        <DialogFooter className="mt-6 flex gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Versandt"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
