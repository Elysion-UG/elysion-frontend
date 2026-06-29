"use client"

import { MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

interface SellerCardProps {
  sellerName: string
  sellerUserId?: string | null
}

export function SellerCard({ sellerName, sellerUserId }: SellerCardProps) {
  const router = useRouter()
  const handleClick = () => {
    if (sellerUserId) router.push(`/producer?id=${sellerUserId}`)
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
      className="cursor-pointer rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:border-sage-300 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100">
          <span className="text-sm font-bold text-sage-700">{sellerName.charAt(0)}</span>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-stone-800">{sellerName}</h4>
          <div className="flex items-center gap-1 text-xs text-stone-500">
            <MapPin className="h-3 w-3 text-sage-500" />
            Verifizierter Verkäufer
          </div>
        </div>
      </div>
    </div>
  )
}
