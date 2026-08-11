"use client"

import { ChevronRight, ChevronDown, Pencil, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
import { Button } from "@/src/components/ui/button"
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
}

export default function AdminCategoryTreeNode({
  node,
  depth,
  expandedIds,
  onToggleExpand,
  onEdit,
  onToggleStatus,
  statusLoading,
}: TreeNodeRowProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  // The status comes off the node itself (#226). It used to be looked up in a
  // `statusMap` built from the separately fetched flat list, defaulting to
  // "ACTIVE" on a miss — and since the backend never sent the field the map was
  // always empty, so every category rendered as active.
  const isActive = node.isActive

  return (
    <>
      <tr className="transition-colors hover:bg-ink-900/30">
        {/* Name with expand toggle */}
        <td className="px-4 py-3">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleExpand(node.id)}
                className="mr-2 h-6 w-6 shrink-0 text-muted-foreground"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(node)}
              className="h-7 gap-1 border-border/60 bg-ink-900/60 px-2 text-xs text-muted-foreground [&_svg]:size-3.5"
              title="Bearbeiten"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            {statusLoading === node.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-green-500" />
            ) : isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(node, true)}
                className="h-7 gap-1 border-border/60 bg-ink-900/60 px-2 text-xs text-muted-foreground"
                title="Deaktivieren"
              >
                <ToggleLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(node, false)}
                className="h-7 gap-1 border-green-600/60 bg-green-700/30 px-2 text-xs text-green-500"
                title="Aktivieren"
              >
                <ToggleRight className="h-4 w-4" />
              </Button>
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
          />
        ))}
    </>
  )
}
