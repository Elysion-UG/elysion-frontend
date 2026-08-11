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
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { ErrorAlert } from "@/src/components/shared/ErrorAlert"
import { formatEuro } from "@/src/lib/currency"
import {
  REFUND_REASON_MAX_LENGTH,
  refundErrorMessage,
  validateRefundAmount,
} from "@/src/lib/refund"
import type { RefundRequestDTO } from "@/src/types"

export interface RefundDialogProps {
  title: string
  description: string
  /**
   * Feste OrderGroup. Fehlt sie, wird sie im Dialog erfasst — den Fall gibt es
   * nur in der Admin-Eskalation, wenn der Vorgang nicht aus einer Zeile heraus
   * gestartet wird.
   */
  orderGroupId?: string
  /** Bereits erstattet, in EUR. `null` = dem Client nicht bekannt. */
  alreadyRefunded?: number | null
  /** Noch erstattbarer Restbetrag in EUR. `null` = dem Client nicht bekannt. */
  remaining: number | null
  /** `"light"` — Verkäufer-Portal, `"dark"` — Admin-Oberfläche. */
  variant?: "light" | "dark"
  /** Muss werfen, wenn die Erstattung fehlschlägt — der Fehler wird hier gezeigt. */
  onSubmit: (dto: RefundRequestDTO) => Promise<unknown>
  onClose: () => void
}

/**
 * Erstattungs-Dialog für beide Portale (#56).
 *
 * Der Betrag wird gegen den offenen Restbetrag geprüft, bevor überhaupt ein
 * Request rausgeht; verbindlich bleibt die Prüfung des Servers. Bei einer
 * Vollerstattung wird **kein** Betrag mitgeschickt — der Server nimmt dann den
 * kompletten Restbetrag, was gegen eine zwischenzeitliche Teilerstattung
 * robuster ist als ein clientseitig eingesetzter Wert.
 *
 * Die Auslösung ist zweistufig: Erstattungen sind endgültig und lassen sich im
 * Frontend nicht zurücknehmen, deshalb steht vor dem Request eine explizite
 * Bestätigung mit dem konkreten Betrag.
 */
export function RefundDialog({
  title,
  description,
  orderGroupId,
  alreadyRefunded = null,
  remaining,
  variant = "light",
  onSubmit,
  onClose,
}: RefundDialogProps) {
  const [groupId, setGroupId] = useState(orderGroupId ?? "")
  const [mode, setMode] = useState<"full" | "partial">("full")
  const [amountInput, setAmountInput] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dark = variant === "dark"
  const nothingLeft = remaining !== null && remaining <= 0

  const validation = validateRefundAmount({ mode, value: amountInput, remaining })
  /** Betrag, der tatsächlich fließt — bei Vollerstattung der bekannte Restbetrag. */
  const effectiveAmount = validation.ok ? (validation.amount ?? remaining) : null

  const handleRequestConfirm = () => {
    if (!groupId.trim()) {
      setError("Bitte die Bestell-ID (OrderGroup) angeben.")
      return
    }
    if (!validation.ok) {
      setError(validation.error)
      return
    }
    setError(null)
    setConfirming(true)
  }

  const handleSubmit = async () => {
    if (!validation.ok) {
      setError(validation.error)
      setConfirming(false)
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({
        orderGroupId: groupId.trim(),
        amount: validation.amount,
        reason: reason.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(refundErrorMessage(err))
      setConfirming(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const labelClass = `mb-1 block text-sm font-medium ${dark ? "text-muted-foreground" : "text-foreground"}`
  const fieldClass = dark ? "border-border/60 bg-ink-900/60 text-muted-foreground" : ""

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      {/* `dark` re-skopt die Tokens im Portal (body-Level) auf die Ink-Dark-Werte;
          sonst rendert der Modal-Text der Admin-Oberfläche mit den Light-Tokens. */}
      <DialogContent
        className={
          dark
            ? "dark max-w-md rounded-xl border border-border/60 bg-ink-900 p-6 shadow-2xl"
            : "max-w-md rounded-xl bg-white p-6 shadow-xl"
        }
      >
        <DialogHeader>
          <DialogTitle
            className={`text-lg font-semibold ${dark ? "text-muted-foreground" : "text-foreground"}`}
          >
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && <ErrorAlert message={error} variant={variant} />}

          {!orderGroupId && (
            <div>
              <label htmlFor="refund-group-id" className={labelClass}>
                Bestell-ID (OrderGroup) *
              </label>
              <Input
                id="refund-group-id"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                placeholder="3f1b0e4a-5c2d-4e6f-8a90-1b2c3d4e5f60"
                className={`font-mono text-sm ${fieldClass}`}
              />
            </div>
          )}

          {remaining !== null && (
            <dl
              className={`rounded-lg px-4 py-3 text-sm ${dark ? "bg-ink-900/60" : "bg-secondary"}`}
            >
              {alreadyRefunded !== null && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Bereits erstattet</dt>
                  <dd className="font-mono">{formatEuro(alreadyRefunded)}</dd>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between font-semibold">
                <dt>Noch erstattbar</dt>
                <dd className="font-mono">{formatEuro(remaining)}</dd>
              </div>
            </dl>
          )}

          {nothingLeft ? (
            <p className="text-sm text-muted-foreground">
              Für diese Bestellung ist nichts mehr erstattbar.
            </p>
          ) : (
            <>
              <fieldset className="space-y-2">
                <legend className={labelClass}>Umfang</legend>
                {(
                  [
                    ["full", "Vollerstattung (kompletter Restbetrag)"],
                    ["partial", "Teilerstattung"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="refund-mode"
                      value={value}
                      checked={mode === value}
                      onChange={() => {
                        setMode(value)
                        setError(null)
                        setConfirming(false)
                      }}
                      className="h-4 w-4 accent-green-600"
                    />
                    <span className={dark ? "text-muted-foreground" : "text-foreground"}>
                      {label}
                    </span>
                  </label>
                ))}
              </fieldset>

              {mode === "partial" && (
                <div>
                  <label htmlFor="refund-amount" className={labelClass}>
                    Betrag in EUR *
                  </label>
                  <Input
                    id="refund-amount"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value)
                      setError(null)
                      setConfirming(false)
                    }}
                    placeholder="24,90"
                    aria-describedby="refund-amount-hint"
                    className={fieldClass}
                  />
                  <p id="refund-amount-hint" className="mt-1 text-xs text-muted-foreground">
                    {remaining !== null
                      ? `Höchstens ${formatEuro(remaining)}, maximal zwei Nachkommastellen.`
                      : "Maximal zwei Nachkommastellen; die Obergrenze prüft der Server."}
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="refund-reason" className={labelClass}>
                  Grund (optional)
                </label>
                <Textarea
                  id="refund-reason"
                  rows={3}
                  value={reason}
                  maxLength={REFUND_REASON_MAX_LENGTH}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="z. B. Retoure: Ware beschädigt angekommen"
                  className={fieldClass}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {reason.length}/{REFUND_REASON_MAX_LENGTH} Zeichen · steht auf dem Beleg und im
                  Prüfprotokoll.
                </p>
              </div>

              {confirming && (
                <p
                  className={`rounded-lg px-4 py-3 text-sm ${dark ? "bg-warning/20 text-warning" : "bg-warning-tint text-warning"}`}
                >
                  {effectiveAmount !== null
                    ? `${formatEuro(effectiveAmount)} werden endgültig an den Käufer zurückgezahlt.`
                    : "Der offene Restbetrag wird endgültig an den Käufer zurückgezahlt."}{" "}
                  Das lässt sich nicht rückgängig machen.
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="mt-6 flex gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={`flex-1 ${
              dark ? "border-border/60 text-muted-foreground hover:bg-ink-900/60" : ""
            }`}
          >
            Abbrechen
          </Button>
          {!nothingLeft && (
            <Button
              type="button"
              variant="destructive"
              onClick={confirming ? handleSubmit : handleRequestConfirm}
              disabled={isSubmitting}
              className="flex-1 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirming ? "Endgültig erstatten" : "Erstattung auslösen"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
