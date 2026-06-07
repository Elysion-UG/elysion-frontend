import type { ElementType } from "react"

interface SellerKpiCardProps {
  label: string
  value: string | number
  icon: ElementType
  color: "teal" | "amber" | "emerald" | "slate" | "blue"
  note?: string
}

const colorMap: Record<SellerKpiCardProps["color"], { bg: string; icon: string }> = {
  teal: { bg: "bg-teal-50", icon: "text-teal-600" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
  slate: { bg: "bg-slate-100", icon: "text-slate-500" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600" },
}

export default function SellerKpiCard({
  label,
  value,
  icon: Icon,
  color,
  note,
}: SellerKpiCardProps) {
  const { bg, icon } = colorMap[color]
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`rounded-lg p-2 ${bg}`}>
          <Icon className={`h-4 w-4 ${icon}`} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </div>
  )
}
