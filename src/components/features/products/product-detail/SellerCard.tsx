"use client"

import { MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { producerHref } from "@/src/lib/seller-url"

interface SellerCardProps {
  sellerName: string
  sellerUserId?: string | null
  /** Public seller slug; `null` for a seller that is not APPROVED. */
  sellerSlug?: string | null
}

export function SellerCard({ sellerName, sellerUserId, sellerSlug }: SellerCardProps) {
  const router = useRouter()
  const handleClick = () => {
    // Without the slug this card would keep producing `?id=` while the seller
    // name right above it already links to `?slug=` — same target, two routes.
    const href = producerHref({ slug: sellerSlug, userId: sellerUserId })
    if (href) router.push(href)
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      className="cursor-pointer rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:border-green-600 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
          <span className="text-sm font-bold text-green-600">{sellerName.charAt(0)}</span>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">{sellerName}</h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 text-green-500" />
            Verifizierter Verkäufer
          </div>
        </div>
      </div>
    </div>
  )
}
