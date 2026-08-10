// Skeleton für den Warenkorb — spiegelt das Zwei-Spalten-Layout von Cart.tsx:
// links Items (2/3), rechts Zusammenfassung (1/3). Shape-match reduziert Layout-
// Shift beim Einblenden der echten Daten.

export function CartSkeleton() {
  return (
    <div className="mx-auto max-w-4xl" data-testid="cart-skeleton" aria-busy="true">
      <div className="mb-8 flex items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-green-50" />
        <div className="space-y-2">
          <div className="h-6 w-36 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-border bg-white p-4 shadow-sm"
            >
              <div className="h-20 w-20 flex-shrink-0 animate-pulse rounded-lg bg-green-50" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
                <div className="mt-3 h-7 w-28 animate-pulse rounded-full bg-secondary" />
              </div>
              <div className="flex flex-col items-end justify-between">
                <div className="h-4 w-4 animate-pulse rounded bg-secondary" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 h-4 w-36 animate-pulse rounded bg-muted" />
            <div className="space-y-2.5">
              <div className="flex justify-between">
                <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-14 animate-pulse rounded bg-secondary" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-5 h-12 w-full animate-pulse rounded-xl bg-green-50" />
          </div>
        </div>
      </div>
    </div>
  )
}
