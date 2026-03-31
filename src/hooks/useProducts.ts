import { useQuery } from "@tanstack/react-query"
import { ProductService } from "@/src/services/product.service"
import type { ProductDetail } from "@/src/types"

export const PRODUCTS_PAGE_SIZE = 12

interface FetchProductsParams {
  search: string
  priceRange: { min: number; max: number }
  apiSort: string | undefined
  currentPage: number
}

async function fetchAndEnrichProducts(params: FetchProductsParams) {
  const page = await ProductService.list({
    search: params.search || undefined,
    minPrice: params.priceRange.min > 0 ? params.priceRange.min : undefined,
    maxPrice: params.priceRange.max < 300 ? params.priceRange.max : undefined,
    sort: params.apiSort,
    page: params.currentPage,
    size: PRODUCTS_PAGE_SIZE,
  })

  // The list endpoint returns no images — enrich each item in parallel via slug.
  const enriched = await Promise.all(
    page.content.map(async (item) => {
      if (!item.slug) return item
      try {
        const detail = await ProductService.getBySlug(item.slug)
        return { ...item, images: detail.images, imageUrls: detail.imageUrls }
      } catch {
        return item
      }
    })
  )

  return {
    products: enriched as ProductDetail[],
    totalElements: page.totalElements,
    totalPages: page.totalPages,
  }
}

export function useProducts(params: FetchProductsParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchAndEnrichProducts(params),
    // Serve cached results for 2 minutes — instant re-render on page revisit.
    staleTime: 2 * 60 * 1000,
    // Keep previous page data visible while a new page/filter is loading.
    placeholderData: (prev) => prev,
  })
}
