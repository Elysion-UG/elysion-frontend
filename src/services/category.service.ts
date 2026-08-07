/**
 * CategoryService — API calls for product categories.
 *
 * Reads are public and return only active categories; writes are admin-only.
 * Endpoint catalogue: docs/api-integration.md.
 *
 * Categories are deactivated, never deleted — there is no delete method.
 */
import { apiRequest } from "@/src/lib/api-client"
import type { Category, CategoryTreeNode, CategoryCreateDTO, CategoryUpdateDTO } from "@/src/types"

export const CategoryService = {
  // ── Public ────────────────────────────────────────────────────────

  async list(): Promise<Category[]> {
    return apiRequest("/api/v1/categories")
  },

  async tree(): Promise<CategoryTreeNode[]> {
    return apiRequest("/api/v1/categories/tree")
  },

  // ── Admin ─────────────────────────────────────────────────────────
  // Writes live under /api/v1/admin/categories. /api/v1/categories is the
  // public read controller (GET only) — posting there returns 405 (#178).

  async create(dto: CategoryCreateDTO): Promise<Category> {
    return apiRequest("/api/v1/admin/categories", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async update(id: string, dto: CategoryUpdateDTO): Promise<Category> {
    return apiRequest(`/api/v1/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  },

  async activate(id: string): Promise<Category> {
    return apiRequest(`/api/v1/admin/categories/${id}/activate`, {
      method: "PATCH",
    })
  },

  async deactivate(id: string): Promise<Category> {
    return apiRequest(`/api/v1/admin/categories/${id}/deactivate`, {
      method: "PATCH",
    })
  },
}
