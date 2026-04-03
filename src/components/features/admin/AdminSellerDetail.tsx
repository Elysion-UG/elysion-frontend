"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Ban, ExternalLink } from "lucide-react"
import { AdminService } from "@/src/services/admin.service"
import type {
  AdminSellerDetail,
  AdminProductListItem,
  SellerStatus,
  ProductStatus,
} from "@/src/types"
import { toast } from "sonner"

const sellerStatusLabel: Record<SellerStatus, string> = {
  PENDING: "Ausstehend",
  APPROVED: "Genehmigt",
  REJECTED: "Abgelehnt",
  SUSPENDED: "Gesperrt",
}

const sellerStatusColor: Record<SellerStatus, string> = {
  PENDING: "bg-amber-900/40 text-amber-400 ring-1 ring-amber-700/40",
  APPROVED: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  REJECTED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
  SUSPENDED: "bg-slate-800 text-slate-500 ring-1 ring-slate-700/40",
}

const productStatusLabel: Record<ProductStatus, string> = {
  DRAFT: "Entwurf",
  REVIEW: "In Prüfung",
  ACTIVE: "Aktiv",
  INACTIVE: "Inaktiv",
  REJECTED: "Abgelehnt",
}

const productStatusColor: Record<ProductStatus, string> = {
  DRAFT: "bg-slate-800 text-slate-400",
  REVIEW: "bg-amber-900/40 text-amber-400 ring-1 ring-amber-700/40",
  ACTIVE: "bg-emerald-900/40 text-emerald-400 ring-1 ring-emerald-700/40",
  INACTIVE: "bg-slate-800 text-slate-500",
  REJECTED: "bg-red-900/40 text-red-400 ring-1 ring-red-700/40",
}

export default function AdminSellerDetailView() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [seller, setSeller] = useState<AdminSellerDetail | null>(null)
  const [products, setProducts] = useState<AdminProductListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [suspendReason, setSuspendReason] = useState("")
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [showSuspendInput, setShowSuspendInput] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await AdminService.getSeller(id)
      setSeller(data)
      // fetch all products and filter by this seller (no server-side seller filter available)
      AdminService.listProducts({ page: 0, size: 200 })
        .then((res) => {
          const sellerProducts = (res.items ?? []).filter(
            (p) => p.sellerId === data.id || p.sellerId === data.userId
          )
          setProducts(sellerProducts)
        })
        .catch(() => {})
    } catch {
      toast.error("Verkäufer konnte nicht geladen werden.")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleApprove = async () => {
    if (!seller) return
    setActionLoading(true)
    try {
      await AdminService.approveSellerProfile(seller.id)
      toast.success(`"${seller.companyName}" genehmigt.`)
      load()
    } catch {
      toast.error("Fehler beim Genehmigen.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!seller || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      await AdminService.rejectSellerProfile(seller.id, rejectReason.trim())
      toast.success(`"${seller.companyName}" abgelehnt.`)
      setShowRejectInput(false)
      setRejectReason("")
      load()
    } catch {
      toast.error("Fehler beim Ablehnen.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!seller || !suspendReason.trim()) return
    setActionLoading(true)
    try {
      await AdminService.suspendSellerProfile(seller.id, suspendReason.trim())
      toast.success(`"${seller.companyName}" gesperrt.`)
      setShowSuspendInput(false)
      setSuspendReason("")
      load()
    } catch {
      toast.error("Fehler beim Sperren.")
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

  if (!seller) {
    return <div className="py-20 text-center text-slate-500">Verkäufer nicht gefunden.</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück
      </button>

      {/* Seller Info */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-xl font-bold text-slate-100">{seller.companyName}</h1>
            <p className="mt-1 text-sm text-slate-500">{seller.userEmail}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${sellerStatusColor[seller.status]}`}
          >
            {sellerStatusLabel[seller.status]}
          </span>
        </div>

        <dl className="divide-y divide-slate-800/60">
          <Row label="Seller-ID" value={seller.id} mono />
          <Row label="User-ID" value={seller.userId} mono />
          <Row label="E-Mail" value={seller.userEmail} />
          <Row label="Erstellt" value={new Date(seller.createdAt).toLocaleString("de-DE")} />
          {seller.updatedAt && (
            <Row
              label="Zuletzt geändert"
              value={new Date(seller.updatedAt).toLocaleString("de-DE")}
            />
          )}
        </dl>

        {/* Actions */}
        {actionLoading ? (
          <div className="mt-6">
            <Loader2 className="h-5 w-5 animate-spin text-cyber-500" />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap gap-3">
              {seller.status === "PENDING" && (
                <>
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-900/30 px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Genehmigen
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectInput((v) => !v)
                      setShowSuspendInput(false)
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-red-800/60 bg-red-900/30 px-4 py-2 text-sm text-red-400 hover:text-red-300"
                  >
                    <XCircle className="h-4 w-4" /> Ablehnen
                  </button>
                </>
              )}
              {seller.status === "APPROVED" && (
                <button
                  onClick={() => {
                    setShowSuspendInput((v) => !v)
                    setShowRejectInput(false)
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm text-slate-300 hover:text-slate-100"
                >
                  <Ban className="h-4 w-4" /> Sperren
                </button>
              )}
            </div>

            {showRejectInput && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ablehnungsgrund (erforderlich)"
                  className="flex-1 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                />
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="rounded-lg border border-red-800/60 bg-red-900/30 px-4 py-2 text-sm text-red-400 hover:text-red-300 disabled:opacity-40"
                >
                  Bestätigen
                </button>
              </div>
            )}

            {showSuspendInput && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Sperrgrund (erforderlich)"
                  className="flex-1 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/20"
                />
                <button
                  onClick={handleSuspend}
                  disabled={!suspendReason.trim()}
                  className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm text-slate-300 hover:text-slate-100 disabled:opacity-40"
                >
                  Bestätigen
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60">
        <div className="border-b border-slate-800/60 px-5 py-4">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-slate-400">
            Produkte ({products.length})
          </h2>
        </div>
        {products.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-600">Keine Produkte vorhanden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800/60 bg-slate-800/20">
              <tr>
                <th className="px-5 py-2.5 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-5 py-2.5 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-5 py-2.5 text-left font-mono text-xs font-medium uppercase tracking-wider text-slate-500">
                  Erstellt
                </th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/admin/products/${p.id}`)}
                  className="cursor-pointer hover:bg-slate-800/30"
                >
                  <td className="px-5 py-3 font-medium text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="max-w-[240px] truncate">{p.name}</span>
                      <a
                        href={`/product?slug=${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Im Shop ansehen"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 text-slate-600 hover:text-slate-400"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${productStatusColor[p.status]}`}
                    >
                      {productStatusLabel[p.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-cyber-500 hover:text-cyber-300"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
