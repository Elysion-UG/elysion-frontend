"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react"
import { CategoryService } from "@/src/services/category.service"
import type { CategoryTreeNode, CategoryCreateDTO, CategoryUpdateDTO, Category } from "@/src/types"
import { toast } from "sonner"

// ── Helpers ──────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

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

const levelLabel: Record<number, string> = {
  1: "Ebene 1",
  2: "Ebene 2",
  3: "Ebene 3",
}

const levelColor: Record<number, string> = {
  1: "bg-cyber-900/40 text-cyber-400 ring-1 ring-cyber-700/40",
  2: "bg-indigo-900/40 text-indigo-400 ring-1 ring-indigo-700/40",
  3: "bg-purple-900/40 text-purple-400 ring-1 ring-purple-700/40",
}

// ── Types ────────────────────────────────────────────────────────────

interface FormState {
  name: string
  slug: string
  parentId: string
  description: string
  order: string
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  parentId: "",
  description: "",
  order: "0",
}

// ── Tree Node ────────────────────────────────────────────────────────

interface TreeNodeRowProps {
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

function TreeNodeRow({
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
          <TreeNodeRow
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

// ── Modal ────────────────────────────────────────────────────────────

interface CategoryFormModalProps {
  title: string
  form: FormState
  onChange: (form: FormState) => void
  onSubmit: () => void
  onClose: () => void
  isSaving: boolean
  parentOptions: { id: string; name: string; level: number }[]
  /** Hide parent selector when editing (parent cannot be changed). */
  hideParent?: boolean
}

function CategoryFormModal({
  title,
  form,
  onChange,
  onSubmit,
  onClose,
  isSaving,
  parentOptions,
  hideParent,
}: CategoryFormModalProps) {
  const handleNameChange = (name: string) => {
    onChange({ ...form, name, slug: slugify(name) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-800/60 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-mono text-lg font-semibold text-slate-100">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-500 hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
              placeholder="z.B. Bio-Textilien"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => onChange({ ...form, slug: e.target.value })}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 font-mono text-sm text-slate-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
              placeholder="auto-generiert"
            />
          </div>

          {/* Parent */}
          {!hideParent && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Eltern-Kategorie
              </label>
              <select
                value={form.parentId}
                onChange={(e) => onChange({ ...form, parentId: e.target.value })}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
              >
                <option value="">Keine (Root)</option>
                {parentOptions
                  .filter((p) => p.level < 3)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {"—".repeat(p.level - 1)} {p.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
              placeholder="Optionale Beschreibung..."
            />
          </div>

          {/* Order */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Sortierung</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => onChange({ ...form, order: e.target.value })}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyber-600/20"
              min={0}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
          >
            Abbrechen
          </button>
          <button
            onClick={onSubmit}
            disabled={isSaving || !form.name.trim()}
            className="flex items-center gap-2 rounded-lg bg-cyber-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] hover:bg-cyber-500 disabled:opacity-40"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

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
      // Only auto-expand root nodes on first load
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
                <TreeNodeRow
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
        <CategoryFormModal
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
        <CategoryFormModal
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
