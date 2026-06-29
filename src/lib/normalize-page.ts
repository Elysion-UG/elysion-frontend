import type { Page } from "@/src/types/pagination"

/**
 * Raw paginated shapes the backend may return, normalized into one `Page<T>`:
 *   - Envelope:  { items, page, size, totalItems, totalPages }   (most endpoints)
 *   - Spring:    { content, number, size, totalElements, totalPages }
 *   - Bare array (legacy endpoints that return a plain list)
 *
 * Centralizing this here removes the per-service ad-hoc mapping and the three
 * competing pagination conventions (#36).
 */
interface RawEnvelope<T> {
  items?: T[]
  content?: T[]
  page?: number
  number?: number
  size?: number
  totalItems?: number
  totalElements?: number
  totalPages?: number
}

/**
 * Normalize a raw backend pagination response into the canonical `Page<T>`.
 *
 * @param raw      The backend response (envelope, Spring shape, or bare array).
 * @param mapItem  Optional per-item mapper (e.g. DTO → domain model).
 */
export function normalizePage<TRaw, TOut>(
  raw: RawEnvelope<TRaw> | TRaw[] | null | undefined,
  mapItem: (item: TRaw) => TOut = (item) => item as unknown as TOut
): Page<TOut> {
  if (Array.isArray(raw)) {
    const items = raw.map(mapItem)
    return { items, page: 0, size: items.length, totalItems: items.length, totalPages: 1 }
  }

  const rawItems = raw?.items ?? raw?.content ?? []
  const items = rawItems.map(mapItem)
  const page = raw?.page ?? raw?.number ?? 0
  const totalItems = raw?.totalItems ?? raw?.totalElements ?? items.length
  const size = raw?.size ?? items.length
  const totalPages = raw?.totalPages ?? (size > 0 ? Math.ceil(totalItems / size) : 1)

  return { items, page, size, totalItems, totalPages }
}
