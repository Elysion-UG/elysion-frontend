"use client"

import { useQuery } from "@tanstack/react-query"
import { AdminService } from "@/src/services/admin.service"

/**
 * TanStack-Query hook for the admin dashboard overview (#35). Replaces the
 * manual load()/useState the page carried; the retry button becomes refetch().
 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => AdminService.getDashboard(),
    staleTime: 30 * 1000,
  })
}
