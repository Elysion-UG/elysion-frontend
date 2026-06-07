import { Suspense } from "react"
import ProductDetail from "@/src/components/features/products/ProductDetail"

export default function ProductPage() {
  return (
    <Suspense>
      <ProductDetail />
    </Suspense>
  )
}
