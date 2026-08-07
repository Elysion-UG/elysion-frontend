"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useEffectEvent } from "@/src/hooks/use-effect-event"
import { Plus, Loader2, RefreshCw } from "lucide-react"
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useToggleCategoryStatus,
} from "@/src/hooks/useAdminCategories"
import { ApiError } from "@/src/lib/api-client"
import type { CategoryTreeNode, CategoryCreateDTO, CategoryUpdateDTO } from "@/src/types"
import { toast } from "sonner"

/**
 * Parse the order field. `Number(x) || undefined` dropped a valid 0 — the
 * backend then rejected the request with "order is required" (#178). Only a
 * blank / unparseable input may become undefined; 0 must survive.
 */
function parseOrder(raw: string): number | undefined {
  const trimmed = raw.trim()
  if (trimmed === "") return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Extract the backend's error message so a failed save is diagnosable (#178). */
function saveErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}
import AdminCategoryTreeNode from "./AdminCategoryTreeNode"
import AdminCategoryFormModal, { type FormState, EMPTY_FORM } from "./AdminCategoryFormModal"

/** Flatten tree into a list of { id, name, level } for the parent dropdown. */
function flattenTree(
  nodes: CategoryTreeNode[],
  result: { id: string; name: string; level: number }[] = []
): { id: string; name: string; level: number }[] {
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, level: node.level })
    if (node.children.length > 0) {
      flattenTree(node.children, result)
    }
  }
  return result
}

export default function AdminCategories() {
  const { data, isLoading, refetch } = useAdminCategories()
  const tree = useMemo(() => data?.tree ?? [], [data])
  const flatCategories = useMemo(() => data?.flat ?? [], [data])
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const toggleStatus = useToggleCategoryStatus()

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const isFirstLoad = useRef(true)

  // Modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  // Inline save error surfaced in the modal — the POST can fail while the modal
  // stays open; a transient toast alone loses the diagnosis (#178).
  const [saveError, setSaveError] = useState<string | null>(null)

  const isSaving = createCategory.isPending || updateCategory.isPending
  const statusLoading = toggleStatus.isPending ? (toggleStatus.variables?.id ?? null) : null

  const closeModal = useCallback(() => {
    setModalMode(null)
    setSaveError(null)
  }, [])

  const statusMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const cat of flatCategories) {
      if (cat.status) {
        map[cat.id] = cat.status
      }
    }
    return map
  }, [flatCategories])

  // Expand all top-level nodes on first successful load (useEffectEvent keeps the
  // set-state-in-effect lint rule happy, as in useAdminList).
  const seedExpanded = useEffectEvent(() => {
    if (data && isFirstLoad.current) {
      setExpandedIds(new Set(data.tree.map((n) => n.id)))
      isFirstLoad.current = false
    }
  })
  useEffect(() => {
    seedExpanded()
  }, [data])

  const parentOptions = useMemo(() => flattenTree(tree), [tree])

  // ── Handlers ───────────────────────────────────────────────────────

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setSaveError(null)
    setModalMode("create")
  }

  const handleOpenEdit = (node: CategoryTreeNode) => {
    const flat = flatCategories.find((c) => c.id === node.id)
    setForm({
      name: node.name,
      slug: node.slug,
      parentId: flat?.parentId ?? "",
      description: flat?.description ?? "",
      order: String(node.order),
    })
    setEditingId(node.id)
    setSaveError(null)
    setModalMode("edit")
  }

  const handleSubmitCreate = () => {
    setSaveError(null)
    const dto: CategoryCreateDTO = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      parentId: form.parentId || undefined,
      description: form.description.trim() || undefined,
      order: parseOrder(form.order),
    }
    createCategory.mutate(dto, {
      onSuccess: closeModal,
      onError: (err) => {
        const message = saveErrorMessage(err, "Fehler beim Erstellen der Kategorie.")
        setSaveError(message)
        toast.error(message)
      },
    })
  }

  const handleSubmitEdit = () => {
    if (!editingId) return
    const dto: CategoryUpdateDTO = {
      name: form.name.trim() || undefined,
      description: form.description.trim() || undefined,
      order: parseOrder(form.order),
    }
    updateCategory.mutate(
      { id: editingId, dto },
      {
        onSuccess: closeModal,
        onError: (err) => {
          const message = saveErrorMessage(err, "Fehler beim Aktualisieren der Kategorie.")
          setSaveError(message)
          toast.error(message)
        },
      }
    )
  }

  const handleToggleStatus = (node: CategoryTreeNode, currentlyActive: boolean) => {
    toggleStatus.mutate({ id: node.id, name: node.name, currentlyActive })
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-mono text-2xl font-normal tracking-wide text-muted-foreground">
            Kategorie-Verwaltung
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hierarchische Kategorien verwalten (max. 3 Ebenen)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void refetch()}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-ink-900/60 px-3 py-2 text-sm text-muted-foreground hover:text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4" /> Aktualisieren
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-ink-900 hover:bg-green-500"
          >
            <Plus className="h-4 w-4" /> Neue Kategorie
          </button>
        </div>
      </div>

      {/* Tree table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-ink-900/60">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        ) : tree.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            Keine Kategorien vorhanden. Erstellen Sie die erste Kategorie.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-ink-900/30">
              <tr>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Slug
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Ebene
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sortierung
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {tree.map((node) => (
                <AdminCategoryTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                  onEdit={handleOpenEdit}
                  onToggleStatus={handleToggleStatus}
                  statusLoading={statusLoading}
                  statusMap={statusMap}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalMode === "create" && (
        <AdminCategoryFormModal
          title="Neue Kategorie"
          form={form}
          onChange={setForm}
          onSubmit={handleSubmitCreate}
          onClose={closeModal}
          isSaving={isSaving}
          parentOptions={parentOptions}
          error={saveError}
        />
      )}
      {modalMode === "edit" && (
        <AdminCategoryFormModal
          title="Kategorie bearbeiten"
          form={form}
          onChange={setForm}
          onSubmit={handleSubmitEdit}
          onClose={closeModal}
          isSaving={isSaving}
          parentOptions={parentOptions}
          hideParent
          error={saveError}
        />
      )}
    </div>
  )
}
