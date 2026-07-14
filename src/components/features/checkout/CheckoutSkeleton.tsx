// Skeleton für den ersten Checkout-Schritt (Adresse) — wird während authLoading
// angezeigt. Shape spiegelt AddressStep: Heading + 2–3 Adress-Cards + Weiter-Button.

export function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-2xl" data-testid="checkout-skeleton" aria-busy="true">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded bg-green-50" />
        <div className="h-7 w-40 animate-pulse rounded bg-muted" />
      </div>

      <div className="mb-8 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="block rounded-xl border-2 border-border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-4 w-4 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-12 w-full animate-pulse rounded-xl bg-green-50" />
    </div>
  )
}
