import { useQuery } from "@tanstack/react-query"
import { ProductService } from "@/src/services/product.service"
import type { SellerFacet } from "@/src/types"

/**
 * Loads the manufacturer filter facet of the product list (#50).
 * Manufacturers change rarely → long stale time.
 */
export function useSellerFacets() {
  return useQuery<SellerFacet[]>({
    queryKey: ["seller-facets"],
    queryFn: () => ProductService.listSellerFacets(),
    staleTime: 30 * 60 * 1000,
  })
}
