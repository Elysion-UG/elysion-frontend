import { Recycle, Shield, Truck } from "lucide-react"

export function ShippingInfo() {
  return (
    <div className="space-y-2.5 rounded-xl border border-sage-100 bg-sage-50 p-4">
      <div className="flex items-center gap-2 text-sm text-sage-700">
        <Truck className="h-4 w-4 text-sage-500" />
        <span>Kostenloser Versand ab €50</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-sage-700">
        <Shield className="h-4 w-4 text-sage-500" />
        <span>
          14 Tage gesetzliches Widerrufsrecht (
          <a href="/widerruf" className="underline hover:text-sage-900">
            Details
          </a>
          )
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-sage-700">
        <Recycle className="h-4 w-4 text-sage-500" />
        <span>Klimafreundlicher Versand (vom Verkäufer zertifiziert)</span>
      </div>
    </div>
  )
}
