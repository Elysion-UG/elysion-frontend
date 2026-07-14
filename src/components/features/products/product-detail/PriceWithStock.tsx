import Link from "next/link"
import { formatEuro } from "@/src/lib/currency"

interface PriceWithStockProps {
  price: number
  inStock: boolean
}

export function PriceWithStock({ price, inStock }: PriceWithStockProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold text-foreground">{formatEuro(price)}</span>
        {inStock ? (
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
            Auf Lager
          </span>
        ) : (
          <span className="rounded-full border border-danger bg-danger-tint px-2.5 py-0.5 text-xs font-medium text-danger">
            Nicht verfügbar
          </span>
        )}
      </div>
      {/* § 1 PAngV: MwSt.-Hinweis */}
      <p className="mt-1 text-xs text-muted-foreground">
        inkl. MwSt.,{" "}
        <Link href="/versand" className="underline hover:text-foreground">
          zzgl. Versandkosten
        </Link>
      </p>
    </div>
  )
}
