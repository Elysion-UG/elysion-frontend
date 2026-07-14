"use client"

import { ChevronRight, ChevronDown, Pencil, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
import type { CategoryTreeNode } from "@/src/types"

const levelColor: Record<number, string> = {
  1: "bg-green-700/40 text-green-500 ring-1 ring-green-500/40",
  2: "bg-info/40 text-info ring-1 ring-info/40",
  3: "bg-muted/40 text-muted-foreground ring-1 ring-border/40",
}

const levelLabel: Record<number, string> = {
  1: "Ebene 1",
  2: "Ebene 2",
  3: "Ebene 3",
}

export interface TreeNodeRowProps {
  node: CategoryTreeNode
  depth: number
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onEdit: (node: CategoryTreeNode) => void
  onToggleStatus: (node: CategoryTreeNode, currentlyActive: boolean) => void
  statusLoading: string | null
  /** Map of id → status from the flat category list */
  statusMap: Record<string, string>
}

export default function AdminCategoryTreeNode({
  node,
  depth,
  expandedIds,
  onToggleExpand,
  onEdit,
  onToggleStatus,
  statusLoading,
  statusMap,
}: TreeNodeRowProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isActive = (statusMap[node.id] ?? "ACTIVE") === "ACTIVE"

  return (
    <>
      <tr className="transition-colors hover:bg-ink-900/30">
        {/* Name with expand toggle */}
        <td className="px-4 py-3">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren ? (
              <button
                onClick={() => onToggleExpand(node.id)}
                className="mr-2 shrink-0 rounded p-0.5 text-muted-foreground hover:text-muted-foreground"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="mr-2 inline-block w-5" />
            )}
            <span
              className={`font-medium ${isActive ? "text-muted-foreground" : "text-muted-foreground line-through"}`}
            >
              {node.name}
            </span>
          </div>
        </td>

        {/* Slug */}
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{node.slug}</td>

        {/* Level badge */}
        <td className="px-4 py-3">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColor[node.level] ?? ""}`}
          >
            {levelLabel[node.level] ?? `L${node.level}`}
          </span>
        </td>

        {/* Order */}
        <td className="px-4 py-3 text-sm text-muted-foreground">{node.order}</td>

        {/* Status */}
        <td className="px-4 py-3">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isActive
                ? "bg-green-700/40 text-green-500 ring-1 ring-green-500/40"
                : "bg-ink-900 text-muted-foreground"
            }`}
          >
            {isActive ? "Aktiv" : "Inaktiv"}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onEdit(node)}
              className="flex items-center gap-1 rounded-lg border border-border/60 bg-ink-900/60 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground"
              title="Bearbeiten"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {statusLoading === node.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-green-500" />
            ) : isActive ? (
              <button
                onClick={() => onToggleStatus(node, true)}
                className="flex items-center gap-1 rounded-lg border border-border/60 bg-ink-900/60 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground"
                title="Deaktivieren"
              >
                <ToggleLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => onToggleStatus(node, false)}
                className="flex items-center gap-1 rounded-lg border border-green-600/60 bg-green-700/30 px-2 py-1 text-xs text-green-500 hover:text-green-500"
                title="Aktivieren"
              >
                <ToggleRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Render children if expanded */}
      {hasChildren &&
        isExpanded &&
        node.children.map((child) => (
          <AdminCategoryTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            statusLoading={statusLoading}
            statusMap={statusMap}
          />
        ))}
    </>
  )
}
