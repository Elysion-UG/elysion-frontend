"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Plus,
  Edit,
  Package,
  ImageOff,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import ProductForm from "@/src/components/features/products/ProductForm"
import { Button } from "@/src/components/ui/button"
import {
  sellerKeys,
  useSellerProductCounts,
  useSellerProductsPage,
  useUpdateSellerProductStatus,
} from "@/src/hooks/useSellerDashboard"
import { sellerProductTransitions } from "@/src/lib/seller-product-transitions"
import type { ProductStatus, SellerProductListItem } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"
import { ErrorAlert, StatusBadge } from "@/src/components/shared"
import {
  productStatusLabel,
  productStatusColor,
  SELLER_TABLE_HEAD_CLASS,
  SELLER_TABLE_CELL_CLASS,
} from "./sellerDashboard.constants"
import SellerKpiCard from "./SellerKpiCard"

interface SellerProductsTabProps {
  isApproved: boolean
}

/**
 * Abweichende Fläche der Aktions-Schaltfläche, abhängig vom Zielstatus des
 * Übergangs. Ohne Eintrag bleibt die Sand-Fläche der `secondary`-Variante.
 */
const TRANSITION_BUTTON_CLASS: Partial<Record<ProductStatus, string>> = {
  REVIEW: "bg-warning-tint text-warning hover:bg-warning-tint",
  ACTIVE: "bg-green-50 text-green-600 hover:bg-green-50",
}

export default function SellerProductsTab({ isApproved }: SellerProductsTabProps) {
  // 0-basiert wie im Backend; der Pager unten rechnet für die Anzeige um.
  const [page, setPage] = useState(0)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editProduct, setEditProduct] = useState<SellerProductListItem | null>(null)

  const queryClient = useQueryClient()
  const productsQuery = useSellerProductsPage(page, isApproved)
  const countsQuery = useSellerProductCounts(isApproved)
  const updateStatus = useUpdateSellerProductStatus()

  const products = productsQuery.data?.items ?? []
  const totalItems = productsQuery.data?.totalItems ?? 0
  const totalPages = productsQuery.data?.totalPages ?? 0
  const counts = countsQuery.data

  // Über das Präfix invalidiert: trifft die sichtbare Seite und die Statuszahlen.
  const refresh = () => void queryClient.invalidateQueries({ queryKey: sellerKeys.products })

  // Kein Löschen-Flow: das Backend hat kein DELETE /api/v1/seller/products/{id}
  // (#219). Der frühere Button schickte ein DELETE an den GET-only-Lese-
  // controller und lief immer in einen 405. Entwürfe bleiben bis zu einem
  // Backend-Gegenstück bestehen.

  return (
    <>
      {totalItems > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SellerKpiCard label="Gesamt" value={totalItems} icon={Package} color="slate" />
          <SellerKpiCard
            label="Aktiv"
            value={counts?.ACTIVE ?? "–"}
            icon={CheckCircle2}
            color="emerald"
          />
          <SellerKpiCard label="Entwürfe" value={counts?.DRAFT ?? "–"} icon={Edit} color="amber" />
          <SellerKpiCard
            label="In Prüfung"
            value={counts?.REVIEW ?? "–"}
            icon={Clock}
            color="teal"
            note="Warten auf Freigabe"
          />
        </div>
      )}
      <div
        className={`rounded-xl border border-border bg-white ${!isApproved ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="text-xl font-semibold text-foreground">Ihre Produkte</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Aktualisieren"
            >
              <RefreshCw className={`h-4 w-4 ${productsQuery.isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button
              disabled={!isApproved}
              onClick={() => {
                setEditProduct(null)
                setShowProductForm(true)
              }}
            >
              <Plus className="h-4 w-4" /> Neues Produkt
            </Button>
          </div>
        </div>

        {productsQuery.isError ? (
          <div className="p-6">
            <ErrorAlert message="Produkte konnten nicht geladen werden." />
          </div>
        ) : /* Ohne Freigabe bleibt die Abfrage deaktiviert und damit dauerhaft
             `isPending` — ein ewiger Spinner wäre die falsche Auskunft. */
        productsQuery.isPending && isApproved ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">Noch keine Produkte</h3>
            <p className="text-muted-foreground">
              Fügen Sie Ihr erstes nachhaltiges Produkt hinzu.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow className="hover:bg-secondary">
                  <TableHead className={SELLER_TABLE_HEAD_CLASS}>Produkt</TableHead>
                  <TableHead className={SELLER_TABLE_HEAD_CLASS}>Preis</TableHead>
                  <TableHead className={SELLER_TABLE_HEAD_CLASS}>Status</TableHead>
                  <TableHead className={SELLER_TABLE_HEAD_CLASS}>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-secondary">
                    <TableCell className={SELLER_TABLE_CELL_CLASS}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                          {product.primaryImage ? (
                            <Package className="h-5 w-5 text-green-600" />
                          ) : (
                            // Ohne Bild kommt das Produkt nicht durch die Prüfung —
                            // das Backend verlangt für DRAFT → REVIEW mindestens eins.
                            <ImageOff
                              className="h-5 w-5 text-muted-foreground"
                              aria-label="Noch kein Produktbild"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {product.id.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`${SELLER_TABLE_CELL_CLASS} text-sm font-medium text-foreground`}
                    >
                      {formatEuro(product.price)}
                    </TableCell>
                    <TableCell className={SELLER_TABLE_CELL_CLASS}>
                      <StatusBadge
                        label={productStatusLabel[product.status]}
                        colorClasses={productStatusColor[product.status]}
                      />
                    </TableCell>
                    <TableCell className={SELLER_TABLE_CELL_CLASS}>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditProduct(product)
                            setShowProductForm(true)
                          }}
                          className="h-8 w-8 text-green-600 hover:text-green-600"
                          title="Bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {sellerProductTransitions(product.status).map((transition) => (
                          <Button
                            key={transition.target}
                            variant="secondary"
                            size="sm"
                            disabled={updateStatus.isPending}
                            onClick={() =>
                              updateStatus.mutate({
                                productId: product.id,
                                status: transition.target,
                              })
                            }
                            className={`h-7 px-2 text-xs ${
                              TRANSITION_BUTTON_CLASS[transition.target] ?? ""
                            }`}
                          >
                            {transition.label}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <span className="text-sm text-muted-foreground">
                  Seite {page + 1} von {totalPages} · {totalItems} Produkte
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page <= 0}
                    aria-label="Vorherige Seite"
                    className="h-8 w-8 border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    aria-label="Nächste Seite"
                    className="h-8 w-8 border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showProductForm && (
        <ProductForm
          productId={editProduct?.id}
          initialValues={
            editProduct ? { name: editProduct.name, basePrice: editProduct.price } : undefined
          }
          onClose={() => {
            setShowProductForm(false)
            setEditProduct(null)
          }}
          onSaved={() => {
            setShowProductForm(false)
            setEditProduct(null)
            // Ein neues Produkt entsteht in DRAFT und landet durch die feste
            // Sortierung (createdAt desc) auf Seite 1.
            setPage(0)
            refresh()
          }}
        />
      )}
    </>
  )
}
