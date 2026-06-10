import { useQuery } from "@tanstack/react-query"
import { MaterialService } from "@/src/services/material.service"
import type { Material } from "@/src/types"

/**
 * Loads the material master data (filter facet + seller form).
 * Materials change rarely → long stale time.
 */
export function useMaterials() {
  return useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: () => MaterialService.list(),
    staleTime: 30 * 60 * 1000,
  })
}
