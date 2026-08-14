import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

import { useSellerFacets } from "./useSellerFacets"
import { ProductService } from "@/src/services/product.service"
import type { SellerFacet } from "@/src/types"

vi.mock("@/src/services/product.service", () => ({
  ProductService: { listSellerFacets: vi.fn() },
}))

const mockedListSellerFacets = vi.mocked(ProductService.listSellerFacets)

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const sellerFacets: SellerFacet[] = [
  { id: "seller-a", companyName: "Alpha Manufaktur", productCount: 3 },
  { id: "seller-b", companyName: "Beta Weberei", productCount: 1 },
]

describe("useSellerFacets (#50)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the manufacturer facet in the backend's order", async () => {
    mockedListSellerFacets.mockResolvedValue(sellerFacets)

    const { result } = renderHook(() => useSellerFacets(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedListSellerFacets).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(sellerFacets)
  })

  it("keeps an empty facet distinguishable from a failure", async () => {
    mockedListSellerFacets.mockResolvedValue([])

    const { result } = renderHook(() => useSellerFacets(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
    expect(result.current.isError).toBe(false)
  })

  it("surfaces a failing endpoint as an error state", async () => {
    mockedListSellerFacets.mockRejectedValue(new Error("schema violation"))

    const { result } = renderHook(() => useSellerFacets(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})
