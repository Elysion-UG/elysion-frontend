import { useQuery } from "@tanstack/react-query"
import { BuyerValueProfileService } from "@/src/services/buyer-value-profile.service"
import { ApiError } from "@/src/lib/api-client"

export function useBuyerValueProfile() {
  return useQuery({
    queryKey: ["buyerValueProfile"],
    queryFn: async () => {
      try {
        return await BuyerValueProfileService.get()
      } catch (e) {
        // 404 means no profile yet — treat as empty (null), not an error.
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
