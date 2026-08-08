import { useQuery } from "@tanstack/react-query"
import { ApiError } from "@/src/lib/api-client"
import { SellerService } from "@/src/services/seller.service"

/**
 * Öffentliches Verkäuferprofil der Produzenten-Seite (Backend #104).
 *
 * Ohne Slug (Altlink mit `?id=`) bleibt die Query deaktiviert — es gibt keinen
 * Lookup über die Seller-Id. Ein `404` (unbekannt **oder** nicht freigegeben)
 * wird nicht wiederholt: er ist ein Endzustand, kein vorübergehender Fehler.
 */
export function usePublicSellerProfile(slug: string | null) {
  return useQuery({
    queryKey: ["public-seller-profile", slug],
    queryFn: () => SellerService.getPublicProfile(slug as string),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 2
    },
  })
}

/** True, wenn der Fehler das „kein freigegebener Verkäufer zu diesem Slug" des Endpoints ist. */
export function isSellerNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}
