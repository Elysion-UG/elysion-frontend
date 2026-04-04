import { cn } from "@/src/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="mb-2 font-mono text-2xl font-bold tracking-wide text-slate-100">{title}</h1>
      {subtitle && <p className="text-slate-500">{subtitle}</p>}
    </div>
  )
}
