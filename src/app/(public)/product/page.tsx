import { Suspense } from "react"
import ProductDetail from "@/src/components/ProductDetail"

export default function ProductPage() {
  return (
    <Suspense>
      <ProductDetail />
    </Suspense>
  )
}
