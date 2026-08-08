import { useQuery } from "@tanstack/react-query"
import { ProductService } from "@/src/services/product.service"
import type { ProductDetail } from "@/src/types"

// Produktliste der Produzenten-Seite. Das Profil selbst kommt seit #104 aus
// `GET /api/v1/sellers/{slug}` (usePublicSellerProfile) — der hier abgeleitete
// Firmenname bleibt der Fallback für Altlinks mit `?id=<uuid>`, für die es
// keinen Profil-Lookup gibt. Kein erfundenes Profil, nur was die Produkte tragen.
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
