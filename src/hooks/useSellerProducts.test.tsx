import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

import { useSellerProducts } from "./useSellerProducts"
import { ProductService } from "@/src/services/product.service"

vi.mock("@/src/services/product.service", () => ({
  ProductService: { list: vi.fn() },
}))

const mockedList = vi.mocked(ProductService.list)

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe("useSellerProducts (#42)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does not fetch when the sellerId is null (disabled query)", () => {
    const { result } = renderHook(() => useSellerProducts(null), { wrapper })
    expect(mockedList).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("derives the company name from the first product that carries seller info", async () => {
    mockedList.mockResolvedValue({
      items: [
        { id: "p1", seller: {} },
        { id: "p2", seller: { companyName: "GreenThread" } },
      ],
      totalItems: 2,
    } as never)

    const { result } = renderHook(() => useSellerProducts("s1"), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedList).toHaveBeenCalledWith({ sellerId: "s1", size: 60 })
    expect(result.current.data).toMatchObject({
      companyName: "GreenThread",
      totalElements: 2,
    })
    expect(result.current.data?.products).toHaveLength(2)
  })

  it("returns a null company name when no product carries seller info", async () => {
    mockedList.mockResolvedValue({ items: [{ id: "p1" }], totalItems: 1 } as never)

    const { result } = renderHook(() => useSellerProducts("s2"), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.companyName).toBeNull()
  })
})
