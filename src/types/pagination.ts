/**
 * Canonical, internal pagination shape — the single source of truth across all
 * services (#36). Replaces the former divergent types `PagedResponse`,
 * `PaginatedResponse` and `ProductPage`.
 *
 * Convention: `page` is the 0-based page index, matching the backend. Components
 * that present a 1-based pager convert at the UI edge (`page + 1` / `p - 1`).
 */
export interface Page<T> {
  items: T[]
  /** 0-based current page index. */
  page: number
  size: number
  totalItems: number
  totalPages: number
}
