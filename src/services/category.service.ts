/**
 * CategoryService — API calls for product categories.
 *
 * Public:
 *   GET /api/v1/categories            — flat list of active categories (wrapped ApiResponse)
 *
 * Admin-only:
 *   POST   /api/v1/categories              — create category
 *   PATCH  /api/v1/categories/{id}         — update category
 *   PATCH  /api/v1/categories/{id}/activate   — activate category
 *   PATCH  /api/v1/categories/{id}/deactivate — deactivate category
 *
 * tree() builds the nested structure client-side from the flat list because
 * the backend's GET /api/v1/categories/tree currently returns 500. The flat
 * endpoint carries every field needed (parentId, level, order) so no
 * server-side fix is required for the admin UI to work.
 */
import { apiRequest } from "@/src/lib/api-client"
import type { Category, CategoryTreeNode, CategoryCreateDTO, CategoryUpdateDTO } from "@/src/types"

/** Build a nested tree from a flat list. Pure, exported for tests. */
export function buildCategoryTree(flat: Category[]): CategoryTreeNode[] {
  // First pass: shallow node per category, indexed by id.
  const nodes = new Map<string, CategoryTreeNode>()
  for (const c of flat) {
    nodes.set(c.id, {
      id: c.id,
      name: c.name,
      slug: c.slug,
      level: c.level,
      order: c.order,
      children: [],
    })
  }

  // Second pass: attach each node to its parent's children array, or treat
  // it as a root. Categories whose parentId references an unknown id are
  // treated as roots too — that mirrors backend behaviour on partial data.
  const roots: CategoryTreeNode[] = []
  for (const c of flat) {
    const node = nodes.get(c.id)!
    const parent = c.parentId ? nodes.get(c.parentId) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Stable ordering at every depth: backend orders by `order`, ties by name.
  const sortNodes = (list: CategoryTreeNode[]): void => {
    list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    for (const node of list) {
      if (node.children.length > 0) sortNodes(node.children)
    }
  }
  sortNodes(roots)

  return roots
}

export const CategoryService = {
  // ── Public ────────────────────────────────────────────────────────

  async list(): Promise<Category[]> {
    return apiRequest("/api/v1/categories")
  },

  /**
   * Returns the category tree. Built client-side from the flat list because
   * the backend's /categories/tree endpoint currently 500s.
   */
  async tree(): Promise<CategoryTreeNode[]> {
    const flat = await apiRequest<Category[]>("/api/v1/categories")
    return buildCategoryTree(flat)
  },

  // ── Admin ─────────────────────────────────────────────────────────

  async create(dto: CategoryCreateDTO): Promise<Category> {
    return apiRequest("/api/v1/categories", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async update(id: string, dto: CategoryUpdateDTO): Promise<Category> {
    return apiRequest(`/api/v1/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async activate(id: string): Promise<Category> {
    return apiRequest(`/api/v1/categories/${id}/activate`, {
      method: "PATCH",
    })
  },

  async deactivate(id: string): Promise<Category> {
    return apiRequest(`/api/v1/categories/${id}/deactivate`, {
      method: "PATCH",
    })
  },
}
