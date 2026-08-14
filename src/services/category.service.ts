/**
 * CategoryService — API calls for product categories.
 *
 * Endpoint catalogue: docs/api-integration.md.
 *
 * Two read families for the same data (#226):
 *   - `list()` / `tree()`     → `/api/v1/categories[...]`, public, **active only**
 *   - `adminList()` / `adminTree()` → `/api/v1/admin/categories[...]`, ADMIN,
 *     **including deactivated entries**
 *
 * The admin variants are what makes a deactivated category reachable again:
 * without them it drops out of every response and the activate endpoint has no
 * row in the UI to be triggered from.
 *
 * Categories are deactivated, never deleted — there is no delete method.
 */
import { z } from "zod"
import { apiRequest } from "@/src/lib/api-client"
import { parseApiResponse } from "@/src/lib/api-schemas"
import type {
  Category,
  CategoryTreeNode,
  CategoryCreateDTO,
  CategoryUpdateDTO,
  CategoryCommandResult,
} from "@/src/types"

// ── Response schemas ──────────────────────────────────────────────────
// Validated at the boundary instead of cast: `status` was declared on the
// Category type for months without the backend ever sending it, and nothing
// noticed (#226). A schema turns that class of drift into a loud error.

const categoryLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

const apiCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().nullish(),
  level: categoryLevelSchema,
  description: z.string().nullish(),
  order: z.number(),
  isActive: z.boolean(),
})

type ApiCategory = z.infer<typeof apiCategorySchema>

const apiCategoryListSchema = z.array(apiCategorySchema)

const apiCategoryTreeNodeSchema: z.ZodType<CategoryTreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    level: categoryLevelSchema,
    order: z.number(),
    isActive: z.boolean(),
    children: z.array(apiCategoryTreeNodeSchema),
  })
)

const apiCategoryTreeSchema = z.array(apiCategoryTreeNodeSchema)

const apiCategoryCommandResultSchema = z.object({
  id: z.string(),
  slug: z.string(),
  level: categoryLevelSchema,
  isActive: z.boolean(),
})

// The backend sends the optional fields as `null`; the Category type declares
// them with `?:`, so `??`-fallbacks behave the same everywhere.
function normalizeCategory(raw: ApiCategory): Category {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    parentId: raw.parentId ?? undefined,
    level: raw.level,
    description: raw.description ?? undefined,
    order: raw.order,
    isActive: raw.isActive,
  }
}

async function fetchCategoryList(path: string, label: string): Promise<Category[]> {
  const raw = await apiRequest<unknown>(path)
  return parseApiResponse(apiCategoryListSchema, raw, label).map(normalizeCategory)
}

async function fetchCategoryTree(path: string, label: string): Promise<CategoryTreeNode[]> {
  const raw = await apiRequest<unknown>(path)
  return parseApiResponse(apiCategoryTreeSchema, raw, label)
}

export const CategoryService = {
  // ── Public reads — active categories only ─────────────────────────

  async list(): Promise<Category[]> {
    return fetchCategoryList("/api/v1/categories", "category.list")
  },

  async tree(): Promise<CategoryTreeNode[]> {
    return fetchCategoryTree("/api/v1/categories/tree", "category.tree")
  },

  // ── Admin reads — including deactivated categories (#226) ─────────

  async adminList(): Promise<Category[]> {
    return fetchCategoryList("/api/v1/admin/categories", "category.adminList")
  },

  async adminTree(): Promise<CategoryTreeNode[]> {
    return fetchCategoryTree("/api/v1/admin/categories/tree", "category.adminTree")
  },

  // ── Admin writes ──────────────────────────────────────────────────
  // Writes live under /api/v1/admin/categories. /api/v1/categories is the
  // public read controller (GET only) — posting there returns 405 (#178).
  //
  // create/update answer with CategoryCommandResponse (id, slug, level,
  // isActive), not a full Category; activate/deactivate answer with `data: null`.

  async create(dto: CategoryCreateDTO): Promise<CategoryCommandResult> {
    const raw = await apiRequest<unknown>("/api/v1/admin/categories", {
      method: "POST",
      body: JSON.stringify(dto),
    })
    return parseApiResponse(apiCategoryCommandResultSchema, raw, "category.create")
  },

  async update(id: string, dto: CategoryUpdateDTO): Promise<CategoryCommandResult> {
    const raw = await apiRequest<unknown>(`/api/v1/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
    return parseApiResponse(apiCategoryCommandResultSchema, raw, "category.update")
  },

  async activate(id: string): Promise<void> {
    await apiRequest<unknown>(`/api/v1/admin/categories/${id}/activate`, {
      method: "PATCH",
    })
  },

  async deactivate(id: string): Promise<void> {
    await apiRequest<unknown>(`/api/v1/admin/categories/${id}/deactivate`, {
      method: "PATCH",
    })
  },
}
