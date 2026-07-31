"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AdminService } from "@/src/services/admin.service"

/**
 * TanStack-Query hooks for the admin finance area (#35). Replaces the manual
 * useState/useEffect `load()` that AdminFinance used to carry, so each tab gets
 * caching, dedup and background refetch, and the component drops to pure
 * presentation. Every list query is gated by `enabled` so only the active tab
 * fetches — matching the previous per-tab load behaviour.
 */

const PAGE = { page: 0, size: 50 } as const

export const adminFinanceKeys = {
  payments: ["admin", "finance", "payments"] as const,
  refunds: ["admin", "finance", "refunds"] as const,
  settlements: ["admin", "finance", "settlements"] as const,
  duePayouts: ["admin", "finance", "due-payouts"] as const,
  payouts: ["admin", "finance", "payouts"] as const,
}

// Serve cached results for 30 s — finance lists change slowly and the tab bar
// makes revisits frequent.
const STALE = 30 * 1000

export function useAdminPayments(enabled: boolean) {
  return useQuery({
    queryKey: adminFinanceKeys.payments,
    queryFn: async () => (await AdminService.listPayments(PAGE)).items ?? [],
    enabled,
    staleTime: STALE,
  })
}

export function useAdminRefunds(enabled: boolean) {
  return useQuery({
    queryKey: adminFinanceKeys.refunds,
    queryFn: async () => (await AdminService.listRefunds(PAGE)).items ?? [],
    enabled,
    staleTime: STALE,
  })
}

export function useAdminSettlements(enabled: boolean) {
  return useQuery({
    queryKey: adminFinanceKeys.settlements,
    queryFn: async () => (await AdminService.listSettlements(PAGE)).items ?? [],
    enabled,
    staleTime: STALE,
  })
}

export function useDuePayouts(enabled: boolean) {
  return useQuery({
    queryKey: adminFinanceKeys.duePayouts,
    queryFn: async () => (await AdminService.listDuePayouts()) ?? [],
    enabled,
    staleTime: STALE,
  })
}

export function useAdminPayouts(enabled: boolean) {
  return useQuery({
    queryKey: adminFinanceKeys.payouts,
    queryFn: async () => (await AdminService.listPayouts(PAGE)).items ?? [],
    enabled,
    staleTime: STALE,
  })
}

/**
 * Releases a seller's due payout. On success the due-payouts list is
 * invalidated so the released seller drops out on the next refetch (replacing
 * the old manual `setDuePayouts(filter)`). `variables` exposes the in-flight
 * sellerId so the row can show a spinner.
 */
export function useReleasePayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sellerId }: { sellerId: string; sellerName: string }) =>
      AdminService.runPayout(sellerId),
    onSuccess: (_data, { sellerName }) => {
      toast.success(`Auszahlung für ${sellerName} freigegeben.`)
      void queryClient.invalidateQueries({ queryKey: adminFinanceKeys.duePayouts })
    },
    onError: () => toast.error("Auszahlung konnte nicht freigegeben werden."),
  })
}

export type MaintenanceAction = "tokens" | "orders"

export function useRunMaintenance() {
  return useMutation({
    mutationFn: async (action: MaintenanceAction) => {
      if (action === "tokens") {
        await AdminService.cleanupRefreshTokens()
      } else {
        await AdminService.expirePendingOrders()
      }
      return action
    },
    onSuccess: (action) => {
      toast.success(
        action === "tokens"
          ? "Refresh-Token-Bereinigung abgeschlossen."
          : "Ausstehende Bestellungen abgelaufen."
      )
    },
    onError: () => toast.error("Fehler beim Ausführen."),
  })
}
