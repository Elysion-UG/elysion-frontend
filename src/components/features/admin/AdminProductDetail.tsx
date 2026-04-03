"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type { AdminProductDetail, AdminSellerDetail, ProductStatus } from "@/src/types"
import { toast } from "sonner"

const statusLabel: Record<ProductStatus, string> = {
  DRAFT: "Entwurf",
  REVIEW: "In Prüfung",
  ACTIVE: "Aktiv",
  INACTIVE: "Inaktiv",
  REJECTED: "Abgelehnt",
}

const statusColor: Record<ProductStatus, string> = {
  DRAFT: "bg-slate-800 text-slate-400",
  REVIEW: "bg-amber-900/40 text-amber-400 ring-1 ring-amber-700/40",
  ACTIVE: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  INACTIVE: "bg-slate-800 text-slate-500",
  REJECTED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
}

export default function AdminProductDetailView() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<AdminProductDetail | null>(null)
  const [seller, setSeller] = useState<AdminSellerDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await AdminService.getProduct(id)
      setProduct(data)
      AdminService.listSellers({ page: 0, size: 200 })
        .then((res) => {
          const match = res.items.find((s) => s.userId === data.sellerId || s.id === data.sellerId)
          if (match) setSeller(match as AdminSellerDetail)
        })
        .catch(() => {})
    } catch {
      toast.error("Produkt konnte nicht geladen werden.")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleActivate = async () => {
    if (!product) return
    setActionLoading(true)
    try {
      await AdminService.activateProduct(product.id)
      toast.success(`"${product.name}" aktiviert.`)
      load()
    } catch {
      toast.error("Fehler beim Aktivieren.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!product) return
    setActionLoading(true)
    try {
      await AdminService.deactivateProduct(product.id)
      toast.success(`"${product.name}" deaktiviert.`)
      load()
    } catch {
      toast.error("Fehler beim Deaktivieren.")
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyber-500" />
      </div>
    )
  }

  if (!product) {
    return <div className="py-20 text-center text-slate-500">Produkt nicht gefunden.</div>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zur Liste
      </button>

      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate font-mono text-xl font-bold text-slate-100">{product.name}</h1>
            <p className="mt-1 font-mono text-xs text-slate-500">{product.slug}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusColor[product.status]}`}
          >
            {statusLabel[product.status]}
          </span>
        </div>

        {/* Details */}
        <dl className="divide-y divide-slate-800/60">
          <Row label="Produkt-ID" value={product.id} mono />
          <Row
            label="Verkäufer"
            value={
              seller ? (
                <Link
                  href={`/admin/sellers/${seller.id}`}
                  className="flex items-center justify-end gap-1 text-cyber-400 hover:text-cyber-300"
                >
                  {seller.companyName}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </Link>
              ) : (
                <span className="font-mono text-xs text-slate-500">{product.sellerId}</span>
              )
            }
          />
          <Row
            label="Verifizierte Zertifikate"
            value={
              <span className="flex items-center gap-1.5">
                <ShieldCheck
                  className={`h-4 w-4 ${product.verifiedCertificateCount > 0 ? "text-emerald-400" : "text-slate-600"}`}
                />
                {product.verifiedCertificateCount}
                {product.verifiedCertificateCount === 0 && (
                  <span className="text-xs text-amber-500">— Aktivierung nicht möglich</span>
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
            <Loader2 className="h-5 w-5 animate-spin text-cyber-500" />
          ) : product.status === "ACTIVE" ? (
            <button
              onClick={handleDeactivate}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm text-slate-300 hover:text-slate-100"
            >
              <ToggleLeft className="h-4 w-4" /> Deaktivieren
            </button>
          ) : product.status === "REVIEW" || product.status === "INACTIVE" ? (
            <button
              onClick={handleActivate}
              disabled={product.verifiedCertificateCount === 0}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-900/30 px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ToggleRight className="h-4 w-4" /> Aktivieren
            </button>
          ) : null}

          <a
            href={`/product?slug=${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
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
      <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className={`text-right text-sm text-slate-200 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  )
}
