import type { ElementType } from "react"

interface SellerKpiCardProps {
  label: string
  value: string | number
  icon: ElementType
  color: "teal" | "amber" | "emerald" | "slate" | "blue"
  note?: string
}

const colorMap: Record<SellerKpiCardProps["color"], { bg: string; icon: string }> = {
  teal: { bg: "bg-green-50", icon: "text-green-600" },
  amber: { bg: "bg-warning-tint", icon: "text-warning" },
  emerald: { bg: "bg-green-50", icon: "text-green-600" },
  slate: { bg: "bg-secondary", icon: "text-muted-foreground" },
  blue: { bg: "bg-info-tint", icon: "text-info" },
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
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`rounded-lg p-2 ${bg}`}>
          <Icon className={`h-4 w-4 ${icon}`} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}
