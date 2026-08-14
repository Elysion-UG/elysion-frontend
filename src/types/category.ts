// ── Category Types ──────────────────────────────────────────────────

/** Flat category item — from GET /api/v1/categories (public) or /api/v1/admin/categories. */
export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  level: 1 | 2 | 3
  description?: string
  order: number
  /**
   * Lifecycle flag as delivered by the backend (`categories.is_active`).
   *
   * The public read only ever returns active categories, so it is always `true`
   * there; only the admin read (`/api/v1/admin/categories`) can return `false`.
   * There used to be a `status: "ACTIVE" | "INACTIVE"` field here that the
   * backend never sent — every category therefore rendered as "Aktiv" and a
   * deactivated one could not be told apart (#226).
   */
  isActive: boolean
}

/** Tree node — from GET /api/v1/categories/tree (public) or /api/v1/admin/categories/tree. */
export interface CategoryTreeNode {
  id: string
  name: string
  slug: string
  level: 1 | 2 | 3
  order: number
  /** See `Category.isActive`. Carried on the node itself so the admin UI never
   *  has to join a status in from a second, separately fetched list (#226). */
  isActive: boolean
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

/**
 * Answer of `POST` / `PATCH /api/v1/admin/categories` — the backend returns
 * `CategoryCommandResponse`, **not** a full `Category`. The docs used to claim
 * otherwise (#226).
 */
export interface CategoryCommandResult {
  id: string
  slug: string
  level: 1 | 2 | 3
  isActive: boolean
}
