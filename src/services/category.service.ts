/**
 * CategoryService — API calls for product categories.
 *
 * Public:
 *   GET /api/v1/categories            — flat list of active categories (wrapped ApiResponse)
 *   GET /api/v1/categories/tree       — nested tree of active categories (wrapped ApiResponse)
 *
 * Admin-only:
 *   POST   /api/v1/categories              — create category
 *   PATCH  /api/v1/categories/{id}         — update category
 *   PATCH  /api/v1/categories/{id}/activate   — activate category
 *   PATCH  /api/v1/categories/{id}/deactivate — deactivate category
 */
import { apiRequest } from "@/src/lib/api-client"
import type {
  Category,
  CategoryTreeNode,
  CategoryCreateDTO,
  CategoryUpdateDTO,
} from "@/src/types"

export const CategoryService = {
  // ── Public ────────────────────────────────────────────────────────

  async list(): Promise<Category[]> {
    return apiRequest("/api/v1/categories")
  },

  async tree(): Promise<CategoryTreeNode[]> {
    return apiRequest("/api/v1/categories/tree")
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
