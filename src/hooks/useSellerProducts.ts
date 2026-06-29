import { useQuery } from "@tanstack/react-query"
import { ProductService } from "@/src/services/product.service"
import type { ProductDetail } from "@/src/types"

// Until a dedicated public seller-profile endpoint exists, the producer page is
// built purely from the seller's public product listing. The company name is
// derived from the products' embedded seller info — no fabricated profile data.
const SELLER_PRODUCTS_PAGE_SIZE = 60

export interface SellerProductsResult {
  products: ProductDetail[]
  companyName: string | null
  totalElements: number
}

async function fetchSellerProducts(sellerId: string): Promise<SellerProductsResult> {
  const page = await ProductService.list({ sellerId, size: SELLER_PRODUCTS_PAGE_SIZE })
  const products = page.items
  const companyName = products.find((p) => p.seller?.companyName)?.seller?.companyName ?? null

  return {
    products,
    companyName,
    totalElements: page.totalItems,
  }
}

export function useSellerProducts(sellerId: string | null) {
  return useQuery({
    queryKey: ["seller-products", sellerId],
    queryFn: () => fetchSellerProducts(sellerId as string),
    enabled: Boolean(sellerId),
    staleTime: 2 * 60 * 1000,
  })
}
