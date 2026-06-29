"use client"

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="mb-2 h-9 w-44 animate-pulse rounded bg-stone-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-stone-200" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-sage-100" />
                <div className="h-5 w-36 animate-pulse rounded bg-stone-200" />
              </div>
              <div className="h-5 w-5 animate-pulse rounded bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
