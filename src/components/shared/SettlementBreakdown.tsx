import { AlertTriangle } from "lucide-react"
import { formatEuro } from "@/src/lib/currency"
import type { FeeChain } from "@/src/lib/settlement"

export interface SettlementBreakdownProps {
  chain: FeeChain
  /** `"light"` — Verkäufer-Portal, `"dark"` — Admin-Oberfläche. */
  variant?: "light" | "dark"
  /** Überschrift der Netto-Zeile; die Fälligkeitsliste benennt sie anders. */
  netLabel?: string
}

/**
 * Die Abrechnungskette als Beleg: **Brutto → Abzüge → Netto** (#53).
 *
 * Bewusst untereinander statt als neun Tabellenspalten. Der Zweck ist nicht,
 * neun Zahlen zu zeigen, sondern eine Rechnung nachvollziehbar zu machen — und
 * die liest man von oben nach unten mit einem Strich vor dem Ergebnis, nicht
 * quer über einen horizontal scrollenden Tabellenkopf.
 *
 * Zwei Positionen fallen aus der reinen Subtraktion heraus und sind deshalb
 * abgesetzt:
 *
 * - **Gebühr ohne Gegenumsatz** (`refundFee`) ist Teil der Stripe-Gebühr und
 *   wird *nicht* mitgerechnet — sie steht eingerückt unter ihr und erklärt nur,
 *   welcher Anteil auf erstattete Beträge entfällt.
 * - **Weitere Korrektur** taucht nur auf, wenn das Netto des Servers nicht zu
 *   den gelieferten Positionen passt. Lieber eine ehrliche Differenzzeile als
 *   eine Aufstellung, die nicht addiert.
 *
 * Ein negatives Netto ist ein regulärer Zustand (§1.1: Vollretoure lässt die
 * Ist-Gebühr stehen, sie wird mit der nächsten Auszahlung verrechnet) und wird
 * deshalb als Forderung ausgewiesen, nicht als Fehler.
 */
export default function SettlementBreakdown({
  chain,
  variant = "light",
  netLabel = "Netto-Auszahlung",
}: SettlementBreakdownProps) {
  const dark = variant === "dark"
  const negativeNet = chain.net < 0

  return (
    <dl
      className={`space-y-1.5 rounded-lg px-4 py-3 text-sm ${
        dark ? "bg-ink-900/60" : "bg-secondary"
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <dt className={dark ? "text-muted-foreground" : "text-foreground"}>Bruttoumsatz</dt>
        <dd className="font-mono tabular-nums">{formatEuro(chain.gross)}</dd>
      </div>

      {chain.lines.map((line) => {
        const info = line.kind === "info"
        return (
          <div
            key={line.key}
            className={`flex items-baseline justify-between gap-4 ${info ? "pl-4" : ""}`}
          >
            <dt
              className={
                info
                  ? "text-xs italic text-muted-foreground"
                  : line.key === "chargeback" || line.key === "refunded"
                    ? "text-danger"
                    : "text-muted-foreground"
              }
            >
              {line.label}
            </dt>
            <dd
              className={`font-mono tabular-nums ${
                info ? "text-xs italic text-muted-foreground" : "text-danger"
              }`}
            >
              {formatEuro(line.amount)}
            </dd>
          </div>
        )
      })}

      <div
        className={`flex items-baseline justify-between gap-4 border-t pt-2 font-semibold ${
          dark ? "border-border/60" : "border-border"
        }`}
      >
        <dt>{netLabel}</dt>
        <dd
          className={`font-mono tabular-nums ${
            negativeNet ? "text-danger" : dark ? "text-green-500" : "text-green-600"
          }`}
        >
          {formatEuro(chain.net)}
        </dd>
      </div>

      {negativeNet && (
        <p className="pt-1 text-xs text-muted-foreground">
          Negatives Netto: Der Betrag wird mit der nächsten Auszahlung verrechnet.
        </p>
      )}

      {!chain.reconciles && (
        <p className="flex items-start gap-2 pt-1 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Die Aufstellung enthält eine Korrektur, die diese Ansicht nicht einzeln benennen kann.
          Verbindlich ist der Settlement-Bericht.
        </p>
      )}
    </dl>
  )
}
