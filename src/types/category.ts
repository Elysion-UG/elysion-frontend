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

export interface CategoryCreateDTO {
  name: string
  slug?: string
  parentId?: string | null
  description?: string
  order?: number
}

export interface CategoryUpdateDTO {
  name?: string
  description?: string
  order?: number
}
