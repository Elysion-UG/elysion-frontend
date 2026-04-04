"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Plus, Loader2, RefreshCw } from "lucide-react"
import { CategoryService } from "@/src/services/category.service"
import type { CategoryTreeNode, CategoryCreateDTO, CategoryUpdateDTO, Category } from "@/src/types"
import { toast } from "sonner"
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
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [flatCategories, setFlatCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const isFirstLoad = useRef(true)

  // Modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const statusMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const cat of flatCategories) {
      if (cat.status) {
        map[cat.id] = cat.status
      }
    }
    return map
  }, [flatCategories])

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [treeData, listData] = await Promise.all([
        CategoryService.tree(),
        CategoryService.list(),
      ])
      setTree(treeData)
      setFlatCategories(listData)
      if (isFirstLoad.current) {
        setExpandedIds(new Set(treeData.map((n) => n.id)))
        isFirstLoad.current = false
      }
    } catch {
      toast.error("Fehler beim Laden der Kategorien.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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
    setModalMode("edit")
  }

  const handleSubmitCreate = async () => {
    setIsSaving(true)
    try {
      const dto: CategoryCreateDTO = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        parentId: form.parentId || undefined,
        description: form.description.trim() || undefined,
        order: Number(form.order) || undefined,
      }
      await CategoryService.create(dto)
      toast.success(`Kategorie "${dto.name}" erstellt.`)
      setModalMode(null)
      load()
    } catch {
      toast.error("Fehler beim Erstellen der Kategorie.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitEdit = async () => {
    if (!editingId) return
    setIsSaving(true)
    try {
      const dto: CategoryUpdateDTO = {
        name: form.name.trim() || undefined,
        description: form.description.trim() || undefined,
        order: Number(form.order) || undefined,
      }
      await CategoryService.update(editingId, dto)
      toast.success("Kategorie aktualisiert.")
      setModalMode(null)
      load()
    } catch {
      toast.error("Fehler beim Aktualisieren der Kategorie.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (node: CategoryTreeNode, currentlyActive: boolean) => {
    setStatusLoading(node.id)
    try {
      if (currentlyActive) {
        await CategoryService.deactivate(node.id)
        toast.success(`"${node.name}" deaktiviert.`)
      } else {
        await CategoryService.activate(node.id)
        toast.success(`"${node.name}" aktiviert.`)
      }
      load()
    } catch {
      toast.error("Fehler beim Statuswechsel.")
    } finally {
      setStatusLoading(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-wide text-slate-100">
            Kategorie-Verwaltung
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Hierarchische Kategorien verwalten (max. 3 Ebenen)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="h-4 w-4" /> Aktualisieren
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-cyber-600 px-3 py-2 text-sm font-medium text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:bg-cyber-500"
          >
            <Plus className="h-4 w-4" /> Neue Kategorie
          </button>
        </div>
      </div>

      {/* Tree table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/60">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
          </div>
        ) : tree.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            Keine Kategorien vorhanden. Erstellen Sie die erste Kategorie.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800/60 bg-slate-800/30">
              <tr>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Slug
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Ebene
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Sortierung
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
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
          onClose={() => setModalMode(null)}
          isSaving={isSaving}
          parentOptions={parentOptions}
        />
      )}
      {modalMode === "edit" && (
        <AdminCategoryFormModal
          title="Kategorie bearbeiten"
          form={form}
          onChange={setForm}
          onSubmit={handleSubmitEdit}
          onClose={() => setModalMode(null)}
          isSaving={isSaving}
          parentOptions={parentOptions}
          hideParent
        />
      )}
    </div>
  )
}
