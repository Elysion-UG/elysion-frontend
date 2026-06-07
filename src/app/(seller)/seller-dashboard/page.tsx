import { Suspense } from "react"
import SellerDashboard from "@/src/components/features/seller/SellerDashboard"

export default function SellerDashboardPage() {
  return (
    <Suspense fallback={null}>
      <SellerDashboard />
    </Suspense>
  )
}
