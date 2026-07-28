"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AdminService } from "@/src/services/admin.service"
import { UserService } from "@/src/services/user.service"
import { CertificateService } from "@/src/services/certificate.service"
import type { AdminSellerDetail, AccountStatus } from "@/src/types"

/**
 * TanStack-Query hooks for the admin detail pages (#35). Each page used to carry
 * a manual `load()` (useState + useEffect) plus per-action `setActionLoading`
 * flags; these hooks give the detail a cached query and turn each admin action
 * into a mutation that invalidates that query so the page reflects the new state
 * without a hand-rolled reload.
 */

export const adminDetailKeys = {
  product: (id: string) => ["admin", "product", id] as const,
  productSeller: (sellerId: string) => ["admin", "product-seller", sellerId] as const,
  order: (id: string) => ["admin", "order", id] as const,
  user: (id: string) => ["admin", "user", id] as const,
  seller: (id: string) => ["admin", "seller", id] as const,
  sellerProducts: (id: string) => ["admin", "seller-products", id] as const,
  certificate: (id: string) => ["admin", "certificate", id] as const,
}

const STALE = 30 * 1000

// ── Product ───────────────────────────────────────────────────────────────────

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: adminDetailKeys.product(id),
    queryFn: () => AdminService.getProduct(id),
    enabled: !!id,
    staleTime: STALE,
  })
}

/**
 * The product detail links to its seller, but there is no by-id seller endpoint
 * reachable from a product, so it scans the seller list for a userId/id match —
 * kept as its own query so it caches independently of the product.
 */
export function useProductSeller(sellerId: string | undefined) {
  return useQuery({
    queryKey: adminDetailKeys.productSeller(sellerId ?? ""),
    queryFn: async (): Promise<AdminSellerDetail | null> => {
      const res = await AdminService.listSellers({ page: 0, size: 200 })
      const match = res.items.find((s) => s.userId === sellerId || s.id === sellerId)
      return (match as AdminSellerDetail) ?? null
    },
    enabled: !!sellerId,
    staleTime: STALE,
  })
}

function useProductStatusMutation(
  action: (id: string) => Promise<unknown>,
  verb: string,
  errorMessage: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => action(id),
    onSuccess: (_data, { id, name }) => {
      toast.success(`"${name}" ${verb}.`)
      void queryClient.invalidateQueries({ queryKey: adminDetailKeys.product(id) })
    },
    onError: () => toast.error(errorMessage),
  })
}

export function useActivateProduct() {
  return useProductStatusMutation(
    (id) => AdminService.activateProduct(id),
    "aktiviert",
    "Fehler beim Aktivieren."
  )
}

export function useDeactivateProduct() {
  return useProductStatusMutation(
    (id) => AdminService.deactivateProduct(id),
    "deaktiviert",
    "Fehler beim Deaktivieren."
  )
}

// ── Order ─────────────────────────────────────────────────────────────────────

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: adminDetailKeys.order(id),
    queryFn: () => AdminService.getOrder(id),
    enabled: !!id,
    staleTime: STALE,
  })
}

// ── User ──────────────────────────────────────────────────────────────────────

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminDetailKeys.user(id),
    queryFn: () => UserService.getUserById(id),
    enabled: !!id,
    staleTime: STALE,
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AccountStatus }) =>
      UserService.updateUserStatus(userId, status),
    onSuccess: (_data, { userId, status }) => {
      toast.success(status === "SUSPENDED" ? "Benutzer gesperrt." : "Benutzer aktiviert.")
      void queryClient.invalidateQueries({ queryKey: adminDetailKeys.user(userId) })
    },
    onError: () => toast.error("Fehler beim Aktualisieren."),
  })
}

export function useUpdateSellerStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sellerProfileId,
      action,
    }: {
      userId: string
      sellerProfileId: string
      action: "APPROVED" | "REJECTED"
    }) => UserService.updateSellerStatus(sellerProfileId, action),
    onSuccess: (_data, { userId, action }) => {
      toast.success(action === "APPROVED" ? "Verkäufer genehmigt." : "Verkäufer abgelehnt.")
      void queryClient.invalidateQueries({ queryKey: adminDetailKeys.user(userId) })
    },
    onError: () => toast.error("Fehler beim Aktualisieren."),
  })
}

// ── Seller ────────────────────────────────────────────────────────────────────

export function useAdminSeller(id: string) {
  return useQuery({
    queryKey: adminDetailKeys.seller(id),
    queryFn: () => AdminService.getSeller(id),
    enabled: !!id,
    staleTime: STALE,
  })
}

/**
 * There is no server-side seller filter for products, so this scans the product
 * list for a sellerId/userId match — its own query so it caches independently.
 */
export function useAdminSellerProducts(seller: AdminSellerDetail | undefined) {
  return useQuery({
    queryKey: adminDetailKeys.sellerProducts(seller?.id ?? ""),
    queryFn: async () => {
      const res = await AdminService.listProducts({ page: 0, size: 200 })
      return (res.items ?? []).filter(
        (p) => p.sellerId === seller?.id || p.sellerId === seller?.userId
      )
    },
    enabled: !!seller,
    staleTime: STALE,
  })
}

interface SellerActionVars {
  id: string
  companyName: string
  reason?: string
}

function useSellerActionMutation(
  action: (vars: SellerActionVars) => Promise<unknown>,
  verb: string,
  errorMessage: string
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: action,
    onSuccess: (_data, { id, companyName }) => {
      toast.success(`"${companyName}" ${verb}.`)
      void queryClient.invalidateQueries({ queryKey: adminDetailKeys.seller(id) })
    },
    onError: () => toast.error(errorMessage),
  })
}

export function useApproveSeller() {
  return useSellerActionMutation(
    ({ id }) => AdminService.approveSellerProfile(id),
    "genehmigt",
    "Fehler beim Genehmigen."
  )
}

export function useRejectSeller() {
  return useSellerActionMutation(
    ({ id, reason }) => AdminService.rejectSellerProfile(id, reason ?? ""),
    "abgelehnt",
    "Fehler beim Ablehnen."
  )
}

export function useSuspendSeller() {
  return useSellerActionMutation(
    ({ id, reason }) => AdminService.suspendSellerProfile(id, reason ?? ""),
    "gesperrt",
    "Fehler beim Sperren."
  )
}

export function useUpdateSellerCommission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) =>
      AdminService.updateSellerCommission(id, rate),
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(adminDetailKeys.seller(id), updated)
      toast.success(`Provision auf ${updated.commissionRate} % gesetzt.`)
    },
    onError: () => toast.error("Provision konnte nicht gespeichert werden."),
  })
}

// ── Certificate ───────────────────────────────────────────────────────────────

export function useAdminCertificate(id: string) {
  return useQuery({
    queryKey: adminDetailKeys.certificate(id),
    queryFn: () => CertificateService.adminGetById(id),
    enabled: !!id,
    staleTime: STALE,
  })
}

export function useVerifyCertificate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => CertificateService.verify(id),
    onSuccess: (_data, id) => {
      toast.success("Zertifikat verifiziert.")
      void queryClient.invalidateQueries({ queryKey: adminDetailKeys.certificate(id) })
    },
    onError: () => toast.error("Fehler beim Verifizieren."),
  })
}

export function useRejectCertificate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      CertificateService.reject(id, reason),
    onSuccess: (_data, { id }) => {
      toast.success("Zertifikat abgelehnt.")
      void queryClient.invalidateQueries({ queryKey: adminDetailKeys.certificate(id) })
    },
    onError: () => toast.error("Fehler beim Ablehnen."),
  })
}
