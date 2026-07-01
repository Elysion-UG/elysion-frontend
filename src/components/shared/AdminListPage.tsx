"use client"

import type { ReactNode } from "react"
import { cn } from "@/src/lib/utils"
import {
  PageHeader,
  AdminFilterBar,
  AdminTableContainer,
  AdminTablePagination,
  ADMIN_TH_CLASS,
  ADMIN_THEAD_CLASS,
  ADMIN_TR_CLICKABLE_CLASS,
} from "@/src/components/shared"
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/src/components/ui/table"

export interface AdminColumn {
  header: ReactNode
  /** Extra classes merged onto ADMIN_TH_CLASS, e.g. "text-right". */
  className?: string
  /** Stable key; falls back to the column index. */
  key?: string
}

export interface AdminListPageProps<Row> {
  title: string
  subtitle?: string
  /** Contents of the filter bar (search/selects/refresh). Omit to hide the bar. */
  filters?: ReactNode
  columns: AdminColumn[]
  rows: Row[]
  isLoading: boolean
  emptyMessage: string
  getRowKey: (row: Row) => string
  /** When set, rows become clickable and get the clickable-row styling. */
  onRowClick?: (row: Row) => void
  /** Renders the row's <TableCell> children; the <TableRow> wrapper, key and
   *  click handler are owned by AdminListPage. */
  renderRow: (row: Row) => ReactNode
  /** 0-based current page. */
  page: number
  totalPages: number
  /** Receives the 0-based target page. */
  onPageChange: (page: number) => void
  /** Extra elements rendered after the table, e.g. modals. */
  children?: ReactNode
}

/**
 * Presentational scaffold shared by every admin list page: header → filter bar
 * → loading/empty-aware table built from a column config + renderRow → pager.
 * Holds no data logic — pair it with {@link useAdminList} for fetching.
 */
export function AdminListPage<Row>({
  title,
  subtitle,
  filters,
  columns,
  rows,
  isLoading,
  emptyMessage,
  getRowKey,
  onRowClick,
  renderRow,
  page,
  totalPages,
  onPageChange,
  children,
}: AdminListPageProps<Row>) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      {filters && <AdminFilterBar>{filters}</AdminFilterBar>}

      <AdminTableContainer
        isLoading={isLoading}
        isEmpty={rows.length === 0}
        emptyMessage={emptyMessage}
      >
        <Table>
          <TableHeader className={ADMIN_THEAD_CLASS}>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={col.key ?? index} className={cn(ADMIN_TH_CLASS, col.className)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? ADMIN_TR_CLICKABLE_CLASS : undefined}
              >
                {renderRow(row)}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <AdminTablePagination
          page={page + 1}
          totalPages={totalPages}
          onPageChange={(p) => onPageChange(p - 1)}
        />
      </AdminTableContainer>

      {children}
    </div>
  )
}
