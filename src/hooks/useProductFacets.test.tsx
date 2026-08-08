import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

import { useProductFacets } from "./useProductFacets"
import { ProductService } from "@/src/services/product.service"
import type { ProductFacets } from "@/src/types"

vi.mock("@/src/services/product.service", () => ({
  ProductService: { listFacets: vi.fn() },
}))

const mockedListFacets = vi.mocked(ProductService.listFacets)

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const facets: ProductFacets = {
  colors: [{ value: "rot", productCount: 5 }],
  sizes: [{ value: "m", productCount: 3 }],
}

describe("useProductFacets (#49)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the colour and size facet from the service", async () => {
    mockedListFacets.mockResolvedValue(facets)

    const { result } = renderHook(() => useProductFacets(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedListFacets).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(facets)
  })

  it("surfaces a failing endpoint as an error state instead of empty data", async () => {
    // The consumer falls back to `?? []`, which is indistinguishable from an
    // empty facet — so the error flag is the only thing the UI can react to.
    mockedListFacets.mockRejectedValue(new Error("500"))

    const { result } = renderHook(() => useProductFacets(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it("shares one cache entry across consumers — the sidebar renders twice", async () => {
    mockedListFacets.mockResolvedValue(facets)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const sharedWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () => ({ first: useProductFacets(), second: useProductFacets() }),
      { wrapper: sharedWrapper }
    )

    await waitFor(() => expect(result.current.first.isSuccess).toBe(true))
    expect(result.current.second.data).toEqual(facets)
    expect(mockedListFacets).toHaveBeenCalledTimes(1)
  })
})
