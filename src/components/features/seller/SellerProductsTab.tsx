"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Edit, Package, RefreshCw, Loader2, CheckCircle2, Clock } from "lucide-react"
import { ProductService } from "@/src/services/product.service"
import ProductForm from "@/src/components/features/products/ProductForm"
import type { ProductListItem, ProductStatus } from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table"
import { StatusBadge } from "@/src/components/shared"
import {
  productStatusLabel,
  productStatusColor,
  SELLER_TABLE_HEAD_CLASS,
  SELLER_TABLE_CELL_CLASS,
} from "./sellerDashboard.constants"
import SellerKpiCard from "./SellerKpiCard"

interface SellerProductsTabProps {
  isApproved: boolean
  userId: string | undefined
}

export default function SellerProductsTab({ isApproved, userId }: SellerProductsTabProps) {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductListItem | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!userId || !isApproved) return
    setProductsLoading(true)
    try {
      const page = await ProductService.list({ sellerId: userId, size: 100 })
      setProducts(page.content)
    } catch {
      toast.error("Produkte konnten nicht geladen werden.")
    } finally {
      setProductsLoading(false)
    }
  }, [userId, isApproved])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleStatusChange = async (productId: string, status: ProductStatus) => {
    try {
      await ProductService.updateStatus(productId, { status })
      toast.success(`Status auf "${productStatusLabel[status]}" gesetzt.`)
      fetchProducts()
    } catch {
      toast.error("Status konnte nicht geändert werden.")
    }
  }

  const activeCount = products.filter(
    (p) => (p as unknown as { status: string }).status === "ACTIVE"
  ).length
  const draftCount = products.filter(
    (p) => (p as unknown as { status: string }).status === "DRAFT"
  ).length
  const reviewCount = products.filter(
    (p) => (p as unknown as { status: string }).status === "REVIEW"
  ).length

  return (
    <>
      {products.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SellerKpiCard label="Gesamt" value={products.length} icon={Package} color="slate" />
          <SellerKpiCard label="Aktiv" value={activeCount} icon={CheckCircle2} color="emerald" />
          <SellerKpiCard label="Entwürfe" value={draftCount} icon={Edit} color="amber" />
          <SellerKpiCard
            label="In Prüfung"
            value={reviewCount}
            icon={Clock}
            color="teal"
            note="Warten auf Freigabe"
          />
        </div>
      )}
      <div
        className={`rounded-xl border border-slate-200 bg-white ${!isApproved ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800">Ihre Produkte</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchProducts}
              className="text-slate-400 transition-colors hover:text-slate-600"
              title="Aktualisieren"
            >
              <RefreshCw className={`h-4 w-4 ${productsLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              disabled={!isApproved}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
              onClick={() => {
                setEditProduct(null)
                setShowProductForm(true)
              }}
            >
              <Plus className="h-4 w-4" /> Neues Produkt
            </button>
          </div>
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="mb-2 text-lg font-semibold text-slate-800">Noch keine Produkte</h3>
            <p className="text-slate-500">Fügen Sie Ihr erstes nachhaltiges Produkt hinzu.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50">
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Produkt</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Preis</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Status</TableHead>
                <TableHead className={SELLER_TABLE_HEAD_CLASS}>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const status = (product as unknown as { status: ProductStatus }).status as
                  | ProductStatus
                  | undefined
                return (
                  <TableRow key={product.id} className="hover:bg-slate-50">
                    <TableCell className={SELLER_TABLE_CELL_CLASS}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100">
                          <Package className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{product.title}</p>
                          <p className="text-xs text-slate-400">ID: {product.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`${SELLER_TABLE_CELL_CLASS} text-sm font-medium text-slate-800`}
                    >
                      {formatEuro(product.price ?? 0)}
                    </TableCell>
                    <TableCell className={SELLER_TABLE_CELL_CLASS}>
                      {status ? (
                        <StatusBadge
                          label={productStatusLabel[status]}
                          colorClasses={productStatusColor[status]}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">–</span>
                      )}
                    </TableCell>
                    <TableCell className={SELLER_TABLE_CELL_CLASS}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditProduct(product)
                            setShowProductForm(true)
                          }}
                          className="text-teal-600 transition-colors hover:text-teal-800"
                          title="Bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {status === "DRAFT" && (
                          <button
                            onClick={() => handleStatusChange(product.id, "REVIEW")}
                            className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 hover:bg-amber-200"
                          >
                            Zur Prüfung
                          </button>
                        )}
                        {status === "ACTIVE" && (
                          <button
                            onClick={() => handleStatusChange(product.id, "INACTIVE")}
                            className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-200"
                          >
                            Deaktivieren
                          </button>
                        )}
                        {status === "INACTIVE" && (
                          <button
                            onClick={() => handleStatusChange(product.id, "ACTIVE")}
                            className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 hover:bg-emerald-200"
                          >
                            Aktivieren
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {showProductForm && (
        <ProductForm
          productId={editProduct?.id}
          initialValues={
            editProduct ? { name: editProduct.title, basePrice: editProduct.price } : undefined
          }
          onClose={() => {
            setShowProductForm(false)
            setEditProduct(null)
          }}
          onSaved={() => {
            setShowProductForm(false)
            setEditProduct(null)
            fetchProducts()
          }}
        />
      )}
    </>
  )
}
