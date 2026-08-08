import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

import { usePublicSellerProfile, isSellerNotFound } from "./usePublicSellerProfile"
import { SellerService } from "@/src/services/seller.service"
import { ApiError } from "@/src/lib/api-client"

vi.mock("@/src/services/seller.service", () => ({
  SellerService: { getPublicProfile: vi.fn() },
}))

const mockedGet = vi.mocked(SellerService.getPublicProfile)

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe("usePublicSellerProfile (#104)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("stays idle without a slug — there is no lookup by seller id", () => {
    const { result } = renderHook(() => usePublicSellerProfile(null), { wrapper })
    expect(mockedGet).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("loads the profile for a slug", async () => {
    mockedGet.mockResolvedValue({
      id: "s1",
      slug: "alpha-manufaktur",
      companyName: "Alpha Manufaktur",
      certifications: [],
    })
    const { result } = renderHook(() => usePublicSellerProfile("alpha-manufaktur"), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGet).toHaveBeenCalledWith("alpha-manufaktur")
    expect(result.current.data?.companyName).toBe("Alpha Manufaktur")
  })

  it("surfaces the 404 of an unknown or unapproved seller", async () => {
    mockedGet.mockRejectedValue(new ApiError(404, "Seller profile not found"))
    const { result } = renderHook(() => usePublicSellerProfile("ghost"), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(isSellerNotFound(result.current.error)).toBe(true)
  })
})

describe("isSellerNotFound", () => {
  it("is true only for a 404 ApiError", () => {
    expect(isSellerNotFound(new ApiError(404, "nope"))).toBe(true)
    expect(isSellerNotFound(new ApiError(500, "boom"))).toBe(false)
    expect(isSellerNotFound(new Error("network"))).toBe(false)
    expect(isSellerNotFound(null)).toBe(false)
  })
})
