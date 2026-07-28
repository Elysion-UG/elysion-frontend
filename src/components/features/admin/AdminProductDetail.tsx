"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ExternalLink, Loader2, ToggleLeft, ToggleRight, ShieldCheck } from "lucide-react"
import {
  useAdminProduct,
  useProductSeller,
  useActivateProduct,
  useDeactivateProduct,
} from "@/src/hooks/useAdminDetail"
import {
  ADMIN_PRODUCT_STATUS_LABEL as statusLabel,
  ADMIN_PRODUCT_STATUS_COLOR as statusColor,
} from "@/src/lib/constants"
import { BackButton, LoadingFullPage, StatusBadge } from "@/src/components/shared"

export default function AdminProductDetailView() {
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading } = useAdminProduct(id)
  const { data: seller } = useProductSeller(product?.sellerId)
  const activate = useActivateProduct()
  const deactivate = useDeactivateProduct()
  const actionLoading = activate.isPending || deactivate.isPending

  const handleActivate = () => {
    if (product) activate.mutate({ id: product.id, name: product.name })
  }

  const handleDeactivate = () => {
    if (product) deactivate.mutate({ id: product.id, name: product.name })
  }

  if (isLoading) {
    return <LoadingFullPage />
  }

  if (!product) {
    return <div className="py-20 text-center text-muted-foreground">Produkt nicht gefunden.</div>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <BackButton label="Zurück zur Liste" className="mb-6" />

      <div className="rounded-xl border border-border/60 bg-ink-900/60 p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate font-mono text-xl font-normal text-muted-foreground">
              {product.name}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{product.slug}</p>
          </div>
          <StatusBadge
            label={statusLabel[product.status]}
            colorClasses={statusColor[product.status]}
            className="shrink-0 px-3 py-1"
          />
        </div>

        {/* Details */}
        <dl className="divide-y divide-border/60">
          <Row label="Produkt-ID" value={product.id} mono />
          <Row
            label="Verkäufer"
            value={
              seller ? (
                <Link
                  href={`/admin/sellers/${seller.id}`}
                  className="flex items-center justify-end gap-1 text-green-500 hover:text-green-500"
                >
                  {seller.companyName}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </Link>
              ) : (
                <span className="font-mono text-xs text-muted-foreground">{product.sellerId}</span>
              )
            }
          />
          <Row
            label="Verifizierte Zertifikate"
            value={
              <span className="flex items-center gap-1.5">
                <ShieldCheck
                  className={`h-4 w-4 ${product.verifiedCertificateCount > 0 ? "text-green-500" : "text-foreground"}`}
                />
                {product.verifiedCertificateCount}
                {product.verifiedCertificateCount === 0 && (
                  <span className="text-xs text-warning">— Aktivierung nicht möglich</span>
                )}
              </span>
            }
          />
          <Row label="Erstellt" value={new Date(product.createdAt).toLocaleString("de-DE")} />
          <Row
            label="Zuletzt geändert"
            value={new Date(product.updatedAt).toLocaleString("de-DE")}
          />
        </dl>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {actionLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-green-500" />
          ) : product.status === "ACTIVE" ? (
            <button
              onClick={handleDeactivate}
              className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-ink-900/60 px-4 py-2 text-sm text-muted-foreground hover:text-muted-foreground"
            >
              <ToggleLeft className="h-4 w-4" /> Deaktivieren
            </button>
          ) : product.status === "REVIEW" || product.status === "INACTIVE" ? (
            <button
              onClick={handleActivate}
              disabled={product.verifiedCertificateCount === 0}
              className="flex items-center gap-1.5 rounded-lg border border-green-600/60 bg-green-700/30 px-4 py-2 text-sm text-green-500 hover:text-green-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ToggleRight className="h-4 w-4" /> Aktivieren
            </button>
          ) : null}

          <a
            href={`/product?slug=${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-ink-900/60 px-4 py-2 text-sm text-muted-foreground hover:text-muted-foreground"
          >
            <ExternalLink className="h-4 w-4" /> Im Shop ansehen
          </a>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-right text-sm text-muted-foreground ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  )
}
