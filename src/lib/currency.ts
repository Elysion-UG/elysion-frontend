/** Convert cents (integer) to euro (float) */
export function centsToEuro(cents: number): number {
  return cents / 100
}

/** Convert euro (float) to cents (integer, rounded) */
export function euroToCents(euro: number): number {
  return Math.round(euro * 100)
}

const EUR_FORMATTER = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
})

/** Format a euro amount as a localised EUR string, e.g. "29,99 €" */
export function formatEuro(euro: number): string {
  return EUR_FORMATTER.format(euro)
}

/** Convert basis points to a percentage value, e.g. 1900 bps → 19 % */
export function bpsToPercent(bps: number): number {
  return bps / 100
}

/** Convert a percentage value to basis points, e.g. 19 % → 1900 bps */
export function percentToBps(percent: number): number {
  return percent * 100
}
