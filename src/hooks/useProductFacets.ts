import { useQuery } from "@tanstack/react-query"
import { ProductService } from "@/src/services/product.service"
import type { ProductFacets } from "@/src/types"

/**
 * Loads the colour/size filter facet of the product list (#49).
 * The facet is global — it does not depend on the active filters — and the
 * underlying catalogue changes rarely → long stale time.
 */
export function useProductFacets() {
  return useQuery<ProductFacets>({
    queryKey: ["product-facets"],
    queryFn: () => ProductService.listFacets(),
    staleTime: 30 * 60 * 1000,
  })
}
