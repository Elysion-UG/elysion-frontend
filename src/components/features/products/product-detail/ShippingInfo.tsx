import Link from "next/link"
import { Recycle, Shield, Truck } from "lucide-react"

export function ShippingInfo() {
  return (
    <div className="space-y-2.5 rounded-xl border border-green-600 bg-green-50 p-4">
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Truck className="h-4 w-4 text-green-500" />
        <span>Kostenloser Versand ab €50</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Shield className="h-4 w-4 text-green-500" />
        <span>
          14 Tage gesetzliches Widerrufsrecht (
          <Link href="/widerruf" className="underline hover:text-green-600">
            Details
          </Link>
          )
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Recycle className="h-4 w-4 text-green-500" />
        <span>Klimafreundlicher Versand (vom Verkäufer zertifiziert)</span>
      </div>
    </div>
  )
}
