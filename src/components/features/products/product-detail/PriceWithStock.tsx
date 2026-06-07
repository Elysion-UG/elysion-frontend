import { formatEuro } from "@/src/lib/currency"

interface PriceWithStockProps {
  price: number
  inStock: boolean
}

export function PriceWithStock({ price, inStock }: PriceWithStockProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold text-stone-900">{formatEuro(price)}</span>
        {inStock ? (
          <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700">
            Auf Lager
          </span>
        ) : (
          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
            Nicht verfügbar
          </span>
        )}
      </div>
      {/* § 1 PAngV: MwSt.-Hinweis */}
      <p className="mt-1 text-xs text-stone-400">
        inkl. MwSt.,{" "}
        <a href="/versand" className="underline hover:text-stone-600">
          zzgl. Versandkosten
        </a>
      </p>
    </div>
  )
}
