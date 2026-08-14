"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CategoryService } from "@/src/services/category.service"
import type { CategoryCreateDTO, CategoryTreeNode, CategoryUpdateDTO, Category } from "@/src/types"

/**
 * TanStack-Query hooks for the admin category manager (#35). The page used to
 * carry a manual load() plus per-action loading flags. The query fetches the
 * tree and the flat list together (the flat list carries parentId/description
 * the tree nodes omit); each mutation invalidates it so the tree reflects the
 * change. Save-error diagnostics (#178) stay in the component, which owns the
 * modal.
 *
 * Both reads go against the **admin** endpoints (#226). The public ones filter
 * on `is_active` — a category deactivated from this very screen would vanish
 * from it and could never be reactivated through the UI again.
 */

export const categoryKeys = {
  all: ["admin", "categories"] as const,
}

export interface AdminCategoryData {
  tree: CategoryTreeNode[]
  flat: Category[]
}

export function useAdminCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: async (): Promise<AdminCategoryData> => {
      const [tree, flat] = await Promise.all([
        CategoryService.adminTree(),
        CategoryService.adminList(),
      ])
      return { tree, flat }
    },
    staleTime: 30 * 1000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CategoryCreateDTO) => CategoryService.create(dto),
    onSuccess: (_data, dto) => {
      toast.success(`Kategorie "${dto.name}" erstellt.`)
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CategoryUpdateDTO }) =>
      CategoryService.update(id, dto),
    onSuccess: () => {
      toast.success("Kategorie aktualisiert.")
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useToggleCategoryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      currentlyActive,
    }: {
      id: string
      name: string
      currentlyActive: boolean
    }) => (currentlyActive ? CategoryService.deactivate(id) : CategoryService.activate(id)),
    onSuccess: (_data, { name, currentlyActive }) => {
      toast.success(currentlyActive ? `"${name}" deaktiviert.` : `"${name}" aktiviert.`)
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
    onError: () => toast.error("Fehler beim Statuswechsel."),
  })
}
