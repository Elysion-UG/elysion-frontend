export function PraeferenzenSkeleton() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <div className="mb-2 h-9 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-6 rounded-xl border border-border bg-white p-5">
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border-2 border-border bg-secondary"
            />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="ml-auto h-4 w-8 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-4 h-2 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
