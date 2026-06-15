import { useQuery } from "@tanstack/react-query"
import { ProductService } from "@/src/services/product.service"

export const PRODUCTS_PAGE_SIZE = 12

// Obergrenze des Preisfilter-Sliders (EUR). Steht der Wert auf dem Maximum,
// wird kein maxPrice an die API gesendet (= „nach oben offen").
export const MAX_PRICE_EUR = 300

interface FetchProductsParams {
  search: string
  priceRange: { min: number; max: number }
  materials: string[]
  apiSort: string | undefined
  currentPage: number
}

async function fetchProducts(params: FetchProductsParams) {
  const page = await ProductService.list({
    search: params.search || undefined,
    minPrice: params.priceRange.min > 0 ? params.priceRange.min : undefined,
    maxPrice: params.priceRange.max < MAX_PRICE_EUR ? params.priceRange.max : undefined,
    materials: params.materials.length > 0 ? params.materials : undefined,
    sort: params.apiSort,
    page: params.currentPage,
    size: PRODUCTS_PAGE_SIZE,
  })

  return {
    products: page.content,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
  }
}

export function useProducts(params: FetchProductsParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
    // Serve cached results for 2 minutes — instant re-render on page revisit.
    staleTime: 2 * 60 * 1000,
    // Keep previous page data visible while a new page/filter is loading.
    placeholderData: (prev) => prev,
  })
}
