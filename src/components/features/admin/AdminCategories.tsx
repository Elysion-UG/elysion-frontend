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
import { Button } from "@/src/components/ui/button"
import type { Category, CategoryTreeNode, CategoryCreateDTO, CategoryUpdateDTO } from "@/src/types"
import { toast } from "sonner"

export const ORDER_INVALID_MESSAGE = "Sortierung muss eine ganze Zahl ≥ 0 sein."

/**
 * Parse the sort-order field (#178).
 *
 * The backend column is `INTEGER NOT NULL DEFAULT 0` and `requireNonNegative`
 * rejects a missing value with "order is required" — so neither a valid `0`
 * (the old `Number(x) || undefined` swallowed it) nor a cleared field may ever
 * become `undefined`. A blank field means 0.
 *
 * Non-integer or negative input can only ever produce a 400 (`@Min(0)` for
 * negatives, a Jackson `Integer` deserialisation failure for decimals), so it
 * is caught here instead of being spent on a server roundtrip.
 *
 * @returns the order, or `null` when the input must not be submitted at all.
 */
function parseOrder(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === "") return 0
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed < 0) return null
  return parsed
}

/** Extract the backend's error message so a failed save is diagnosable (#178). */
function saveErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export const MISSING_FLAT_ENTRY_MESSAGE =
  "Diese Kategorie fehlt in der geladenen Liste. Bitte aktualisieren und erneut versuchen."

/**
 * Seed the edit form from the tree node plus its flat-list counterpart (#226).
 *
 * `parentId` and `description` only exist on the flat list, and tree and list
 * arrive from two separate HTTP calls — there is no atomic snapshot. The old
 * code seeded `flat?.parentId ?? ""`, where `""` means *both* "root" and "no
 * flat entry found". A missing entry therefore submitted an empty parent, and
 * `resolveParent(null)` moves the category to root/level 1 while the equally
 * empty description wipes the stored one. Silent data loss — exactly what #178
 * hardened against.
 *
 * The two meanings are separated here: `null` is "not found" and must block the
 * edit, `""` inside a returned form state is a genuine root category.
 */
export function buildEditFormState(
  node: Pick<CategoryTreeNode, "id" | "name" | "slug" | "order">,
  flatCategories: Category[]
): FormState | null {
  const flat = flatCategories.find((c) => c.id === node.id)
  if (!flat) return null
  return {
    name: node.name,
    slug: node.slug,
    parentId: flat.parentId ?? "",
    description: flat.description ?? "",
    order: String(node.order),
  }
}
import AdminCategoryTreeNode from "./AdminCategoryTreeNode"
import AdminCategoryFormModal, {
  type FormState,
  EMPTY_FORM,
  slugify,
} from "./AdminCategoryFormModal"

/**
 * Flatten tree into a list of { id, name, level } for the parent dropdown.
 *
 * Deactivated nodes are skipped along with their subtree (#226). They only
 * appear in the tree at all because this screen reads the admin endpoints, and
 * offering one as a parent would be a trap: the backend happily accepts it
 * (`resolveParent` looks the parent up with `findById`), but the resulting child
 * can never be activated — `/activate` requires an active parent. A deactivated
 * node cannot have active children either (`/deactivate` refuses that), so
 * pruning the whole subtree loses nothing.
 */
function flattenTree(
  nodes: CategoryTreeNode[],
  result: { id: string; name: string; level: number }[] = []
): { id: string; name: string; level: number }[] {
  for (const node of nodes) {
    if (!node.isActive) continue
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
    const seeded = buildEditFormState(node, flatCategories)
    if (!seeded) {
      // No flat entry ⇒ parent and description are unknown. Opening the modal
      // anyway would offer a form whose blank fields look like deliberate
      // values and would unnest the category on save (#226).
      toast.error(MISSING_FLAT_ENTRY_MESSAGE)
      return
    }
    setForm(seeded)
    setEditingId(node.id)
    setSaveError(null)
    setModalMode("edit")
  }

  const handleSubmitCreate = () => {
    setSaveError(null)
    const order = parseOrder(form.order)
    if (order === null) {
      setSaveError(ORDER_INVALID_MESSAGE)
      return
    }
    const name = form.name.trim()
    const dto: CategoryCreateDTO = {
      name,
      // slug is @NotBlank backend-side — re-derive it when the admin cleared
      // the auto-filled field rather than sending nothing.
      slug: form.slug.trim() || slugify(name),
      parentId: form.parentId || undefined,
      description: form.description.trim() || undefined,
      order,
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
    setSaveError(null)
    // Re-checked at submit time, not just when the modal opened: the query can
    // refetch while the modal is up, and a category that has meanwhile
    // disappeared from the flat list would be saved with a stale parent (#226).
    if (!flatCategories.some((c) => c.id === editingId)) {
      setSaveError(MISSING_FLAT_ENTRY_MESSAGE)
      toast.error(MISSING_FLAT_ENTRY_MESSAGE)
      return
    }
    const order = parseOrder(form.order)
    if (order === null) {
      setSaveError(ORDER_INVALID_MESSAGE)
      return
    }
    const name = form.name.trim()
    // The PATCH body is a full replacement. Sending only name/description/order
    // failed the backend's @NotBlank on slug, and an omitted parentId makes
    // resolveParent() fall back to root/level 1 — which would silently unnest
    // every edited sub-category. Both must travel with every update (#178).
    const dto: CategoryUpdateDTO = {
      name,
      slug: form.slug.trim() || slugify(name),
      parentId: form.parentId || undefined,
      description: form.description.trim() || undefined,
      order,
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-1.5 border border-border/60 bg-ink-900/60 text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4" /> Aktualisieren
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="gap-1.5">
            <Plus className="h-4 w-4" /> Neue Kategorie
          </Button>
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
