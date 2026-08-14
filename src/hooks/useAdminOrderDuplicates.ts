"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ApiError } from "@/src/lib/api-client"
import { AdminOrderDuplicateService } from "@/src/services/admin-order-duplicate.service"
import { DUPLICATE_RESOLUTION_LABEL } from "@/src/lib/order-duplicate"
import type {
  OrderDuplicateFlagStatus,
  OrderDuplicateResolveDTO,
  OrderDuplicateResolveResult,
} from "@/src/types"

/**
 * TanStack-Query-Hooks der Duplicate-Review (#59). Gleiche Bauweise wie
 * `useAdminFinance`: Query-Keys zentral, Mutation invalidiert Liste und Zähler.
 */
export const adminOrderDuplicateKeys = {
  all: ["admin", "order-duplicates"] as const,
  list: (status: OrderDuplicateFlagStatus | "ALL", page: number) =>
    ["admin", "order-duplicates", "list", status, page] as const,
  stats: ["admin", "order-duplicates", "stats"] as const,
}

const PAGE_SIZE = 25
const STALE = 30 * 1000

export function useOrderDuplicates(status: OrderDuplicateFlagStatus | "ALL", page: number) {
  return useQuery({
    queryKey: adminOrderDuplicateKeys.list(status, page),
    queryFn: () =>
      AdminOrderDuplicateService.list({
        page,
        size: PAGE_SIZE,
        status: status === "ALL" ? undefined : status,
      }),
    staleTime: STALE,
  })
}

export function useOrderDuplicateStats() {
  return useQuery({
    queryKey: adminOrderDuplicateKeys.stats,
    queryFn: () => AdminOrderDuplicateService.stats(),
    staleTime: STALE,
  })
}

export interface ResolveDuplicateVariables extends OrderDuplicateResolveDTO {
  id: string
}

/**
 * Protokolliert die Entscheidung. Der Erfolgs-Toast formuliert bewusst
 * „vermerkt" statt „storniert": der Endpoint schreibt nur mit — die Erstattung
 * läuft weiter über den Finanzbereich.
 *
 * `409` bedeutet, dass jemand anderes denselben Fall bereits anders entschieden
 * hat. Statt zu überschreiben wird die Liste neu geladen, damit die vorhandene
 * Entscheidung sichtbar wird.
 */
export function useResolveOrderDuplicate(
  onResolved?: (result: OrderDuplicateResolveResult) => void
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: ResolveDuplicateVariables) =>
      AdminOrderDuplicateService.resolve(id, dto),
    onSuccess: (result) => {
      toast.success(
        `Entscheidung vermerkt: ${DUPLICATE_RESOLUTION_LABEL[result.resolution]}. Der Endpoint protokolliert nur — Erstattungen laufen weiter über den Finanzbereich.`
      )
      void queryClient.invalidateQueries({ queryKey: adminOrderDuplicateKeys.all })
      onResolved?.(result)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("Dieser Fall wurde bereits anders entschieden. Die Liste wird neu geladen.")
        void queryClient.invalidateQueries({ queryKey: adminOrderDuplicateKeys.all })
        return
      }
      toast.error("Entscheidung konnte nicht gespeichert werden.")
    },
  })
}
