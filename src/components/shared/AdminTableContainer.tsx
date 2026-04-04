import type { ReactNode } from "react"
import { cn } from "@/src/lib/utils"
import { LoadingFullPage } from "./LoadingFullPage"
import { EmptyMessage } from "./EmptyMessage"

interface AdminTableContainerProps {
  isLoading: boolean
  isEmpty: boolean
  emptyMessage: string
  children: ReactNode
  className?: string
}

export function AdminTableContainer({
  isLoading,
  isEmpty,
  emptyMessage,
  children,
  className,
}: AdminTableContainerProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/60",
        className
      )}
    >
      {isLoading ? (
        <LoadingFullPage />
      ) : isEmpty ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        children
      )}
    </div>
  )
}
