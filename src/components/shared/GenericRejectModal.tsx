"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog"
import { Textarea } from "@/src/components/ui/textarea"
import { toast } from "sonner"
import { useAsyncAction } from "@/src/hooks/useAsyncAction"

interface GenericRejectModalProps {
  title: string
  description?: string
  /** Called with the rejection reason. Should call the service AND show a success toast. */
  onSubmit: (reason: string) => Promise<void>
  onClose: () => void
}

export function GenericRejectModal({
  title,
  description,
  onSubmit,
  onClose,
}: GenericRejectModalProps) {
  const [reason, setReason] = useState("")
  const { isLoading: loading, execute } = useAsyncAction()

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Bitte Ablehnungsgrund angeben.")
      return
    }
    await execute(() => onSubmit(reason), { errorMessage: "Fehler beim Ablehnen." })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg font-semibold text-slate-100">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-slate-500">{description}</DialogDescription>
          )}
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Ablehnungsgrund..."
          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
        />
        <DialogFooter className="mt-4 flex gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-700/60 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-700 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Ablehnen
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
