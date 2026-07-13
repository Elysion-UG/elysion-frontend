import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { toast } from "sonner"
import { useAdminList } from "./useAdminList"

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}))

interface Row {
  id: string
}

describe("useAdminList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("starts in loading state and loads the first page", async () => {
    const fetchPage = vi.fn(async () => ({
      items: [{ id: "a" }, { id: "b" }],
      totalPages: 3,
      totalItems: 42,
    }))

    const { result } = renderHook(() => useAdminList<Row>({ fetchPage, errorMessage: "Fehler" }))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fetchPage).toHaveBeenCalledWith(0)
    expect(result.current.items).toEqual([{ id: "a" }, { id: "b" }])
    expect(result.current.totalPages).toBe(3)
    expect(result.current.totalItems).toBe(42)
  })

  it("defaults totalItems to the item count when the result omits it", async () => {
    const fetchPage = vi.fn(async () => ({ items: [{ id: "a" }], totalPages: 1 }))

    const { result } = renderHook(() => useAdminList<Row>({ fetchPage, errorMessage: "Fehler" }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.totalItems).toBe(1)
  })

  it("shows a toast and stops loading when fetchPage rejects", async () => {
    const fetchPage = vi.fn(async () => {
      throw new Error("boom")
    })

    const { result } = renderHook(() =>
      useAdminList<Row>({ fetchPage, errorMessage: "Ladefehler" })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(toast.error).toHaveBeenCalledWith("Ladefehler")
    expect(result.current.items).toEqual([])
  })

  it("refetches with the new page when setPage is called", async () => {
    const fetchPage = vi.fn(async (page: number) => ({
      items: [{ id: `page-${page}` }],
      totalPages: 5,
    }))

    const { result } = renderHook(() => useAdminList<Row>({ fetchPage, errorMessage: "Fehler" }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setPage(2))

    await waitFor(() => expect(result.current.items).toEqual([{ id: "page-2" }]))
    expect(fetchPage).toHaveBeenLastCalledWith(2)
  })

  it("reloads with the current page when reload is called", async () => {
    const fetchPage = vi.fn(async () => ({ items: [{ id: "a" }], totalPages: 1 }))

    const { result } = renderHook(() => useAdminList<Row>({ fetchPage, errorMessage: "Fehler" }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetchPage).toHaveBeenCalledTimes(1)

    await act(async () => {
      result.current.reload()
    })

    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2))
    expect(fetchPage).toHaveBeenLastCalledWith(0)
  })

  it("reloads when the fetchPage identity changes (filter change)", async () => {
    const first = vi.fn(async () => ({ items: [{ id: "first" }], totalPages: 1 }))
    const second = vi.fn(async () => ({ items: [{ id: "second" }], totalPages: 1 }))

    const { result, rerender } = renderHook(
      ({ fetchPage }) => useAdminList<Row>({ fetchPage, errorMessage: "Fehler" }),
      { initialProps: { fetchPage: first } }
    )

    await waitFor(() => expect(result.current.items).toEqual([{ id: "first" }]))

    rerender({ fetchPage: second })

    await waitFor(() => expect(result.current.items).toEqual([{ id: "second" }]))
    expect(second).toHaveBeenCalledWith(0)
  })
})
