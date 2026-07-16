import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { useAsyncAction } from "./useAsyncAction"

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}))

describe("useAsyncAction (#42)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("starts idle", () => {
    const { result } = renderHook(() => useAsyncAction())
    expect(result.current.isLoading).toBe(false)
  })

  it("toggles isLoading around a successful action and shows no toast", async () => {
    const { result } = renderHook(() => useAsyncAction())

    let resolveFn: () => void = () => {}
    const fn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve
        })
    )

    let executePromise: Promise<void>
    act(() => {
      executePromise = result.current.execute(fn)
    })

    // Loading is on while the action is in flight.
    await waitFor(() => expect(result.current.isLoading).toBe(true))
    expect(fn).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveFn()
      await executePromise
    })

    expect(result.current.isLoading).toBe(false)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("shows the error toast and rethrows when the action fails", async () => {
    const { result } = renderHook(() => useAsyncAction())
    const boom = new Error("boom")
    const fn = vi.fn(() => Promise.reject(boom))

    await expect(
      act(async () => {
        await result.current.execute(fn, { errorMessage: "Aktion fehlgeschlagen" })
      })
    ).rejects.toThrow("boom")

    expect(toast.error).toHaveBeenCalledWith("Aktion fehlgeschlagen")
    expect(result.current.isLoading).toBe(false)
  })

  it("rethrows without a toast when no errorMessage is given", async () => {
    const { result } = renderHook(() => useAsyncAction())
    const fn = vi.fn(() => Promise.reject(new Error("silent")))

    await expect(
      act(async () => {
        await result.current.execute(fn)
      })
    ).rejects.toThrow("silent")

    expect(toast.error).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })
})
