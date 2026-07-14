import { cn } from "@/src/lib/utils"

interface EmptyMessageProps {
  message: string
  className?: string
}

export function EmptyMessage({ message, className }: EmptyMessageProps) {
  return <div className={cn("py-16 text-center text-muted-foreground", className)}>{message}</div>
}
