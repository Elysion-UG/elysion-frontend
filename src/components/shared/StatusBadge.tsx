import { cn } from "@/src/lib/utils"

interface StatusBadgeProps {
  label: string
  colorClasses: string
  className?: string
}

export default function StatusBadge({ label, colorClasses, className }: StatusBadgeProps) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colorClasses, className)}>
      {label}
    </span>
  )
}
