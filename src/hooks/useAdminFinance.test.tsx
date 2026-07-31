import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

import { useAdminPayments, useDuePayouts, useReleasePayout } from "./useAdminFinance"
import { AdminService } from "@/src/services/admin.service"

vi.mock("@/src/services/admin.service", () => ({
  AdminService: {
    listPayments: vi.fn(),
    listDuePayouts: vi.fn(),
    runPayout: vi.fn(),
  },
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mocked = vi.mocked(AdminService)

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

describe("useAdminFinance (#35)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("does not fetch payments while its tab is inactive (enabled=false)", () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAdminPayments(false), { wrapper })
    expect(mocked.listPayments).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("fetches and unwraps the payments page when enabled", async () => {
    mocked.listPayments.mockResolvedValue({ items: [{ paymentId: "pay_1" }] } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAdminPayments(true), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ paymentId: "pay_1" }])
  })

  it("releasing a payout runs it and invalidates the due-payouts list", async () => {
    // First load returns one due seller; after release the refetch returns none.
    mocked.listDuePayouts
      .mockResolvedValueOnce([{ sellerId: "s1", sellerName: "GreenThread" }] as never)
      .mockResolvedValueOnce([] as never)
    mocked.runPayout.mockResolvedValue({} as never)

    const { wrapper } = makeWrapper()
    const due = renderHook(() => useDuePayouts(true), { wrapper })
    const release = renderHook(() => useReleasePayout(), { wrapper })

    await waitFor(() => expect(due.result.current.isSuccess).toBe(true))
    expect(due.result.current.data).toHaveLength(1)

    release.result.current.mutate({ sellerId: "s1", sellerName: "GreenThread" })

    await waitFor(() => expect(mocked.runPayout).toHaveBeenCalledWith("s1"))
    // invalidation triggers a refetch that now returns the empty list
    await waitFor(() => expect(due.result.current.data).toHaveLength(0))
  })
})
