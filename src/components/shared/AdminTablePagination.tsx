import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/src/components/ui/button"
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
        <Button
          variant="outline"
          size="icon"
          aria-label="Vorherige Seite"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-8 w-8 border border-border/60 bg-ink-900/60 text-muted-foreground hover:bg-muted/60 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Nächste Seite"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="h-8 w-8 border border-border/60 bg-ink-900/60 text-muted-foreground hover:bg-muted/60 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
