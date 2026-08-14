"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Textarea } from "@/src/components/ui/textarea"
import StatusBadge from "@/src/components/shared/StatusBadge"
import { formatEuro } from "@/src/lib/currency"
import {
  DUPLICATE_CONFIDENCE_COLOR,
  DUPLICATE_CONFIDENCE_LABEL,
  DUPLICATE_NOTE_MAX_LENGTH,
  DUPLICATE_RESOLUTION_COLOR,
  DUPLICATE_RESOLUTION_LABEL,
  canDecideDuplicate,
  duplicateBuyerLabel,
  duplicateConfidence,
  formatSecondsApart,
  orderRefLabel,
  validateDuplicateDecision,
} from "@/src/lib/order-duplicate"
import type {
  OrderDuplicateFlag,
  OrderDuplicateOrderRef,
  OrderDuplicateResolution,
  OrderDuplicateResolveDTO,
} from "@/src/types"

interface DuplicateDecisionDialogProps {
  flag: OrderDuplicateFlag
  isSubmitting: boolean
  onSubmit: (dto: OrderDuplicateResolveDTO) => void
  onClose: () => void
}

const RESOLUTION_HINT: Record<OrderDuplicateResolution, string> = {
  RELEASED: "Beide Bestellungen sind echt und bleiben unverändert bestehen.",
  CANCELLED_REFUNDED:
    "Der Verdacht hat sich bestätigt. Storno und Erstattung müssen Sie zusätzlich selbst auslösen — siehe Hinweis unten.",
}

// Prop heißt `order`, nicht `ref` — `ref` ist in React reserviert und würde
// nicht als Prop ankommen.
function OrderCard({ label, order: orderRef }: { label: string; order: OrderDuplicateOrderRef }) {
  return (
    <div className="flex-1 rounded-lg border border-border/60 bg-ink-900/40 p-3">
      <p className="font-eyebrow text-[10px] font-semibold uppercase tracking-widest text-sand-page/50">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-sand-page">{orderRefLabel(orderRef)}</p>
      <dl className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        <div className="flex justify-between gap-2">
          <dt>Status</dt>
          <dd className="font-mono">{orderRef.status ?? "–"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Zahlung</dt>
          <dd className="font-mono">{orderRef.paymentStatus ?? "–"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Summe</dt>
          <dd className="font-mono">
            {orderRef.total === null ? "–" : formatEuro(orderRef.total)}
          </dd>
        </div>
      </dl>
    </div>
  )
}

/**
 * Entscheidungs-Dialog eines Verdachtsfalls.
 *
 * Das Notizfeld erscheint **nur** bei offenen Fällen: eine nachgereichte Notiz
 * würde das Backend beim idempotenten Zweitaufruf still verwerfen. Bei einem
 * entschiedenen Fall zeigt der Dialog deshalb ausschließlich die vom Server
 * gelieferte `resolutionNote`.
 */
export default function DuplicateDecisionDialog({
  flag,
  isSubmitting,
  onSubmit,
  onClose,
}: DuplicateDecisionDialogProps) {
  const [resolution, setResolution] = useState<OrderDuplicateResolution | null>(null)
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  const decidable = canDecideDuplicate(flag)
  const confidence = duplicateConfidence(flag.secondsApart)

  const handleSubmit = () => {
    const validation = validateDuplicateDecision({ resolution, note })
    if (!validation.valid) {
      setError(validation.error)
      return
    }
    setError(null)
    onSubmit(validation.payload)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      {/* `dark` re-skopt die Tokens im Portal auf die Ink-Dark-Werte (#140). */}
      <DialogContent className="dark max-h-[90vh] max-w-2xl overflow-y-auto rounded-xl border border-border/60 bg-ink-900 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold text-sand-page">
            Verdachtsfall prüfen
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {duplicateBuyerLabel(flag)} · erkannt am{" "}
            {new Date(flag.detectedAt).toLocaleString("de-DE")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <OrderCard label="Frühere Bestellung" order={flag.duplicateOf} />
          <ArrowRight
            className="mx-auto h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <OrderCard label="Spätere Bestellung (Verdacht)" order={flag.order} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono text-sand-page/80">
            {formatSecondsApart(flag.secondsApart)} Abstand
          </span>
          <StatusBadge
            label={DUPLICATE_CONFIDENCE_LABEL[confidence]}
            colorClasses={DUPLICATE_CONFIDENCE_COLOR[confidence]}
          />
          <span className="font-mono" title={flag.matchSignature}>
            Signatur {flag.matchSignature.slice(0, 12)}…
          </span>
        </div>

        {decidable ? (
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium text-sand-page">Entscheidung</legend>
            <div className="space-y-2">
              {(Object.keys(DUPLICATE_RESOLUTION_LABEL) as OrderDuplicateResolution[]).map(
                (option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                      resolution === option
                        ? "border-green-600/60 bg-green-700/15"
                        : "border-border/60 bg-ink-900/40 hover:bg-ink-900/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolution"
                      value={option}
                      checked={resolution === option}
                      onChange={() => {
                        setResolution(option)
                        setError(null)
                      }}
                      className="mt-1 h-4 w-4 shrink-0 accent-green-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-sand-page">
                        {DUPLICATE_RESOLUTION_LABEL[option]}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {RESOLUTION_HINT[option]}
                      </span>
                    </span>
                  </label>
                )
              )}
            </div>

            <label
              htmlFor="duplicate-note"
              className="mt-4 block text-sm font-medium text-sand-page"
            >
              Begründung (optional)
            </label>
            <Textarea
              id="duplicate-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={DUPLICATE_NOTE_MAX_LENGTH}
              placeholder="z. B. Kundin hat telefonisch bestätigt, dass die zweite Bestellung ein Versehen war"
              className="mt-1 w-full rounded-lg border border-border/60 bg-ink-900/60 px-3 py-2 text-sm text-sand-page placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <p className="mt-1 text-right font-mono text-[11px] text-muted-foreground">
              {note.length}/{DUPLICATE_NOTE_MAX_LENGTH}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Die Begründung lässt sich später nicht mehr ändern — ein zweiter Aufruf mit derselben
              Entscheidung verwirft sie stillschweigend.
            </p>

            {resolution === "CANCELLED_REFUNDED" && (
              <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-sand-page/80">
                Diese Auswahl wird nur <strong>protokolliert</strong>. Die Erstattung lösen Sie
                anschließend unter{" "}
                <Link
                  href="/admin/finance"
                  className="font-medium text-green-500 underline underline-offset-2"
                >
                  Finanzen → Erstattungen
                </Link>{" "}
                aus; ein Endpoint zum Stornieren der Bestellung fehlt noch (Backend-Issue #220).
              </p>
            )}

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          </fieldset>
        ) : (
          <div className="mt-4 rounded-lg border border-border/60 bg-ink-900/40 p-4">
            <p className="mb-2 text-sm font-medium text-sand-page">Bereits entschieden</p>
            {flag.resolution && (
              <StatusBadge
                label={DUPLICATE_RESOLUTION_LABEL[flag.resolution]}
                colorClasses={DUPLICATE_RESOLUTION_COLOR[flag.resolution]}
              />
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              {flag.resolutionNote ?? "Keine Begründung hinterlegt."}
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {flag.resolvedAt ? new Date(flag.resolvedAt).toLocaleString("de-DE") : "–"}
              {flag.resolvedBy ? ` · Admin ${flag.resolvedBy.slice(0, 8)}` : ""}
            </p>
          </div>
        )}

        <DialogFooter className="mt-6 flex gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border/60 text-muted-foreground hover:bg-ink-900/60"
          >
            {decidable ? "Abbrechen" : "Schließen"}
          </Button>
          {decidable && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 [&_svg]:size-3"
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />} Entscheidung vermerken
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
