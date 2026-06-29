"use client"

import { useState, useEffect, useCallback } from "react"
import { useEffectEvent } from "@/src/hooks/use-effect-event"
import { toast } from "sonner"

/** Shape every admin-list fetch resolves to. `totalItems` is optional for
 *  endpoints that don't paginate server-side (e.g. client-filtered arrays). */
export interface AdminListResult<Row> {
  items: Row[]
  totalPages: number
  totalItems?: number
}

export interface UseAdminListOptions<Row> {
  /**
   * Loads one page. Receives the current 0-based page so the caller's closure
   * only needs to depend on its filter state, not on `page` — this avoids the
   * circular dependency between the controller's `page` and the fetch closure.
   * Memoize over the active filters (useCallback).
   */
  fetchPage: (page: number) => Promise<AdminListResult<Row>>
  /** Toast text shown when `fetchPage` rejects. */
  errorMessage: string
}

export interface AdminListController<Row> {
  items: Row[]
  isLoading: boolean
  /** 0-based current page. */
  page: number
  totalPages: number
  totalItems: number
  /** Set the 0-based page; triggers a reload via the effect. */
  setPage: (page: number) => void
  /** Re-run the current fetch (e.g. refresh button or post-action reload). */
  reload: () => void
}

/**
 * Encapsulates the load/pagination boilerplate shared by every admin list page:
 * `isLoading`/`items`/`totalPages` state, the initial + page-change fetch, and
 * toast-on-error. Keeps the data source injectable (`fetchPage`) so the future
 * TanStack-Query migration (#35) is a drop-in replacement, not a rewrite.
 */
export function useAdminList<Row>({
  fetchPage,
  errorMessage,
}: UseAdminListOptions<Row>): AdminListController<Row> {
  const [items, setItems] = useState<Row[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetchPage(page)
      const loaded = res.items ?? []
      setItems(loaded)
      setTotalPages(res.totalPages ?? 1)
      setTotalItems(res.totalItems ?? loaded.length)
    } catch {
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [fetchPage, page, errorMessage])

  // useEffectEvent keeps the Effect from re-firing on every render while still
  // calling the latest `load`; the Effect re-runs only when `load` identity
  // changes (page or filter change).
  const runEffect = useEffectEvent(() => {
    load()
  })
  useEffect(() => {
    runEffect()
  }, [load])

  return { items, isLoading, page, totalPages, totalItems, setPage, reload: load }
}
