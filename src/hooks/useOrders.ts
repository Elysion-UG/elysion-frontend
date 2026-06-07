import { useQuery } from "@tanstack/react-query"
import { OrderService } from "@/src/services/order.service"

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => OrderService.list(),
    // Serve cached results for 2 minutes — instant re-render on page revisit.
    staleTime: 2 * 60 * 1000,
  })
}
