/** Format a euro amount as a localized string: 29.99 → "€ 29,99" */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

/** Convert integer cents to euro decimal: 2999 → 29.99 */
export function centsToEuro(cents: number): number {
  return cents / 100
}

/** Convert euro decimal to integer cents: 29.99 → 2999 */
export function euroToCents(euro: number): number {
  return Math.round(euro * 100)
}

/** Convert basis points to percentage: 1900 → 19 */
export function bpsToPercent(bps: number): number {
  return bps / 100
}

/** Convert percentage to basis points: 19 → 1900 */
export function percentToBps(pct: number): number {
  return Math.round(pct * 100)
}
