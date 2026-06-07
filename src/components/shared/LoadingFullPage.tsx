import { Loader2 } from "lucide-react"
import { cn } from "@/src/lib/utils"

interface LoadingFullPageProps {
  className?: string
}

export function LoadingFullPage({ className }: LoadingFullPageProps) {
  return (
    <div className={cn("flex items-center justify-center py-20", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
    </div>
  )
}
