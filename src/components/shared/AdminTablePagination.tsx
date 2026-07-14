import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/src/lib/utils"

interface AdminTablePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function AdminTablePagination({
  page,
  totalPages,
  onPageChange,
  className,
}: AdminTablePaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-border/60 px-4 py-3",
        className
      )}
    >
      <span className="text-sm text-muted-foreground">
        Seite {page} von {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-border/60 bg-ink-900/60 p-1.5 text-muted-foreground hover:bg-muted/60 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-lg border border-border/60 bg-ink-900/60 p-1.5 text-muted-foreground hover:bg-muted/60 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
