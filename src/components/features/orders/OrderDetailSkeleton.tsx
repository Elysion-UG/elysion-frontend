// Spiegelt die drei Karten-Sektionen von OrderDetail.tsx: Kopf mit Order-Nummer,
// Lieferadresse, ein Seller-Paket, Summen-Karte.

export function OrderDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl" data-testid="order-detail-skeleton" aria-busy="true">
      <div className="mb-6 h-4 w-36 animate-pulse rounded bg-secondary" />

      <div className="mb-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-xl bg-green-50" />
            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-28 animate-pulse rounded bg-secondary" />
            </div>
          </div>
          <div className="h-7 w-24 animate-pulse rounded-full bg-green-50" />
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-3 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-3 w-48 animate-pulse rounded bg-secondary" />
          <div className="h-3 w-56 animate-pulse rounded bg-secondary" />
          <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-secondary" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-14 w-14 animate-pulse rounded-lg bg-green-50" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-1/4 animate-pulse rounded bg-secondary" />
              </div>
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-4">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
