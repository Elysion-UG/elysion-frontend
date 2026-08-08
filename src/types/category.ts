// ── Category Types ──────────────────────────────────────────────────
export type CategoryStatus = "ACTIVE" | "INACTIVE"

/** Flat category item — from GET /api/v1/categories */
export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  level: 1 | 2 | 3
  description?: string
  order: number
  status?: CategoryStatus
}

/** Tree node — from GET /api/v1/categories/tree */
export interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  level: 1 | 2 | 3
  order: number
  children: CategoryTreeNode[]
}

/**
 * POST /api/v1/admin/categories — `name`, `slug` and `order` are mandatory
 * backend-side (`@NotBlank` / `requireNonNegative`); omitting any of them is a
 * guaranteed 400, so they are required here too (#178).
 */
export interface CategoryCreateDTO {
  name: string
  slug: string
  parentId?: string | null
  description?: string
  order: number
}

/**
 * PATCH /api/v1/admin/categories/{id} is a **full replacement**, not a sparse
 * patch: `name`, `slug` and `order` are mandatory, and the backend re-derives
 * `level` from `parentId` on every update. An omitted `parentId` resolves to
 * root/level 1 — i.e. it silently unnests the category — so the current parent
 * must always be sent along (#178).
 *
 * `isActive` is deliberately absent: the backend rejects it and requires the
 * dedicated activate/deactivate endpoints.
 */
export interface CategoryUpdateDTO {
  name: string
  slug: string
  parentId?: string | null
  description?: string
  order: number
}
