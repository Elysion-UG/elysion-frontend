"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { SellerOrderService } from "@/src/services/seller-order.service"
import { SellerProductService } from "@/src/services/seller-product.service"
import { ProductService } from "@/src/services/product.service"
import { CertificateService } from "@/src/services/certificate.service"
import { SellerProfileService } from "@/src/services/seller-profile.service"
import { SellerValueProfileService } from "@/src/services/seller-value-profile.service"
import { ApiError } from "@/src/lib/api-client"
import { formatEuro } from "@/src/lib/currency"
import { PRODUCT_STATUS_LABEL } from "@/src/lib/constants/status-labels"
import type { ProductStatus, RefundRequestDTO, SellerCertificateCreateDTO } from "@/src/types"

// Derive the mutation input types straight from the service signatures — these
// endpoints have no exported DTO type, and inferring avoids drift.
type SellerProfileUpdateInput = Parameters<typeof SellerProfileService.update>[0]
type SellerValueProfileUpsertInput = Parameters<typeof SellerValueProfileService.upsert>[0]

/**
 * TanStack-Query hooks for the seller dashboard tabs (#35). Replaces the manual
 * useState/useEffect `fetchX()` each tab used to carry: queries give caching and
 * background refetch, mutations invalidate the matching query so the list
 * refreshes without hand-rolled reload calls.
 */

export const sellerKeys = {
  orders: ["seller", "orders"] as const,
  /** Präfix über Produktseiten **und** Statuszahlen — invalidieren trifft beides. */
  products: ["seller", "products"] as const,
  productsPage: (page: number) => ["seller", "products", "page", page] as const,
  productCounts: ["seller", "products", "counts"] as const,
  certificates: ["seller", "certificates"] as const,
  settlements: ["seller", "settlements"] as const,
  profile: ["seller", "profile"] as const,
  valueProfile: ["seller", "value-profile"] as const,
}

const STALE = 30 * 1000

// ── Orders ────────────────────────────────────────────────────────────────────

export function useSellerOrders() {
  return useQuery({
    queryKey: sellerKeys.orders,
    queryFn: async () => (await SellerOrderService.list({ size: 100 })).items,
    staleTime: STALE,
  })
}

export function useUpdateSellerOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, status }: { groupId: string; status: string }) =>
      SellerOrderService.updateStatus(groupId, status),
    onSuccess: () => {
      toast.success("Status aktualisiert.")
      void queryClient.invalidateQueries({ queryKey: sellerKeys.orders })
    },
    onError: () => toast.error("Status konnte nicht geändert werden."),
  })
}

export function useDeliverSellerOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupId: string) => SellerOrderService.deliver(groupId),
    onSuccess: () => {
      toast.success("Als geliefert markiert.")
      void queryClient.invalidateQueries({ queryKey: sellerKeys.orders })
    },
    onError: () => toast.error("Fehler beim Aktualisieren."),
  })
}

/**
 * Erstattung auf einer eigenen OrderGroup (#56). Der Fehlerfall wird bewusst
 * **nicht** hier abgefangen: das Modal zeigt ihn instanz- und konsequenzgenau
 * inline an (§1.9), ein zusätzlicher Toast würde dieselbe Aussage doppeln.
 *
 * Nach Erfolg werden Bestellungen **und** Abrechnungen invalidiert — die
 * Gegenbuchung verändert beide Sichten in derselben Transaktion.
 */
export function useSellerRefund() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: RefundRequestDTO) => SellerOrderService.refund(dto),
    onSuccess: (result) => {
      toast.success(`${formatEuro(result.amount)} erstattet.`)
      void queryClient.invalidateQueries({ queryKey: sellerKeys.orders })
      void queryClient.invalidateQueries({ queryKey: sellerKeys.settlements })
    },
  })
}

// ── Products ──────────────────────────────────────────────────────────────────
//
// Quelle ist ausschließlich `GET /api/v1/seller/products` (#227). Der öffentliche
// Katalog zeigt nur `ACTIVE` und hat neu angelegte Entwürfe deshalb nie geliefert.

/** Seitengröße der Produktverwaltung — der Default des Backends. */
export const SELLER_PRODUCTS_PAGE_SIZE = 20

/** Status, deren Zahlen als KPI-Kachel über der Tabelle stehen. */
export const SELLER_PRODUCT_KPI_STATUSES = ["ACTIVE", "DRAFT", "REVIEW"] as const

export function useSellerProductsPage(page: number, enabled = true) {
  return useQuery({
    queryKey: sellerKeys.productsPage(page),
    queryFn: () => SellerProductService.list({ page, size: SELLER_PRODUCTS_PAGE_SIZE }),
    enabled,
    staleTime: STALE,
    // Beim Blättern die alte Seite stehen lassen, statt die Tabelle gegen einen
    // Ladezustand zu tauschen.
    placeholderData: keepPreviousData,
  })
}

/**
 * Statuszahlen der KPI-Kacheln. Bewusst eine eigene Abfrage: über die gerade
 * sichtbare Seite gezählt wären die Zahlen falsch, sobald ein Verkäufer mehr
 * Produkte hat, als auf eine Seite passen.
 */
export function useSellerProductCounts(enabled = true) {
  return useQuery({
    queryKey: sellerKeys.productCounts,
    queryFn: () => SellerProductService.countByStatus(SELLER_PRODUCT_KPI_STATUSES),
    enabled,
    staleTime: STALE,
  })
}

export function useUpdateSellerProductStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, status }: { productId: string; status: ProductStatus }) =>
      ProductService.updateStatus(productId, { status }),
    onSuccess: (_result, { status }) => {
      toast.success(`Status auf „${PRODUCT_STATUS_LABEL[status]}" gesetzt.`)
      void queryClient.invalidateQueries({ queryKey: sellerKeys.products })
    },
    // Bei `DRAFT → REVIEW` steht im 400 der eigentliche Grund („REVIEW requires
    // at least one image"). Ihn zu verschlucken lässt den Verkäufer ratlos vor
    // einem Knopf zurück, der nichts tut — deshalb wird er durchgereicht.
    onError: (err) =>
      toast.error(
        err instanceof ApiError && err.status === 400 && err.message
          ? `Status konnte nicht geändert werden: ${err.message}`
          : "Status konnte nicht geändert werden."
      ),
  })
}

// ── Certificates ──────────────────────────────────────────────────────────────

export function useSellerCertificates() {
  return useQuery({
    queryKey: sellerKeys.certificates,
    queryFn: async () => {
      const data = await CertificateService.sellerList()
      return Array.isArray(data) ? data : []
    },
    staleTime: STALE,
  })
}

export function useCreateSellerCertificate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: SellerCertificateCreateDTO) => CertificateService.sellerCreate(dto),
    onSuccess: () => {
      toast.success("Zertifikat erstellt und zur Prüfung eingereicht.")
      void queryClient.invalidateQueries({ queryKey: sellerKeys.certificates })
    },
    onError: () => toast.error("Fehler beim Erstellen."),
  })
}

// ── Settlements ───────────────────────────────────────────────────────────────

export function useSellerSettlements() {
  return useQuery({
    queryKey: sellerKeys.settlements,
    queryFn: () => SellerOrderService.listSettlements(),
    staleTime: STALE,
  })
}

// ── Company profile ───────────────────────────────────────────────────────────

export function useSellerProfile() {
  return useQuery({
    queryKey: sellerKeys.profile,
    queryFn: () => SellerProfileService.get(),
    staleTime: STALE,
  })
}

export function useUpdateSellerProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: SellerProfileUpdateInput) => SellerProfileService.update(dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(sellerKeys.profile, updated)
      toast.success("Firmenprofil gespeichert.")
    },
    onError: () => toast.error("Firmenprofil konnte nicht gespeichert werden."),
  })
}

// ── Sustainability value profile ──────────────────────────────────────────────

/**
 * The value profile is optional: the backend answers 404 when the seller has
 * not created one yet. That is a normal state, not an error, so the query maps
 * 404 → null and lets every other failure surface as an error.
 */
export function useSellerValueProfile() {
  return useQuery({
    queryKey: sellerKeys.valueProfile,
    queryFn: async () => {
      try {
        return await SellerValueProfileService.get()
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
    staleTime: STALE,
  })
}

export function useUpsertSellerValueProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: SellerValueProfileUpsertInput) => SellerValueProfileService.upsert(dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(sellerKeys.valueProfile, updated)
      toast.success("Nachhaltigkeitsprofil gespeichert.")
    },
    onError: () => toast.error("Nachhaltigkeitsprofil konnte nicht gespeichert werden."),
  })
}
