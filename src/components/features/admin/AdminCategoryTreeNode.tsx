"use client"

import { ChevronRight, ChevronDown, Pencil, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
import type { CategoryTreeNode } from "@/src/types"

const levelColor: Record<number, string> = {
  1: "bg-cyber-900/40 text-cyber-400 ring-1 ring-cyber-700/40",
  2: "bg-indigo-900/40 text-indigo-400 ring-1 ring-indigo-700/40",
  3: "bg-purple-900/40 text-purple-400 ring-1 ring-purple-700/40",
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
      <tr className="transition-colors hover:bg-slate-800/30">
        {/* Name with expand toggle */}
        <td className="px-4 py-3">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren ? (
              <button
                onClick={() => onToggleExpand(node.id)}
                className="mr-2 shrink-0 rounded p-0.5 text-slate-500 hover:text-slate-300"
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
              className={`font-medium ${isActive ? "text-slate-200" : "text-slate-500 line-through"}`}
            >
              {node.name}
            </span>
          </div>
        </td>

        {/* Slug */}
        <td className="px-4 py-3 font-mono text-xs text-slate-500">{node.slug}</td>

        {/* Level badge */}
        <td className="px-4 py-3">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColor[node.level] ?? ""}`}
          >
            {levelLabel[node.level] ?? `L${node.level}`}
          </span>
        </td>

        {/* Order */}
        <td className="px-4 py-3 text-sm text-slate-400">{node.order}</td>

        {/* Status */}
        <td className="px-4 py-3">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isActive
                ? "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40"
                : "bg-slate-800 text-slate-500"
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
              className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
              title="Bearbeiten"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {statusLoading === node.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-cyber-500" />
            ) : isActive ? (
              <button
                onClick={() => onToggleStatus(node, true)}
                className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                title="Deaktivieren"
              >
                <ToggleLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => onToggleStatus(node, false)}
                className="flex items-center gap-1 rounded-lg border border-emerald-800/60 bg-emerald-900/30 px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300"
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
