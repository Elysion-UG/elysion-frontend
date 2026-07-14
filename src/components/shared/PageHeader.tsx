import { cn } from "@/src/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="mb-2 font-heading text-2xl font-bold tracking-tight text-sand-page">
        {title}
      </h1>
      {subtitle && <p className="text-sand-page/60">{subtitle}</p>}
    </div>
  )
}
