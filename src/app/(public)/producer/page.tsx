import { Suspense } from "react"
import ProducerPage from "@/src/components/features/products/ProducerPage"

export default function ProducerPageRoute() {
  return (
    <Suspense>
      <ProducerPage />
    </Suspense>
  )
}
