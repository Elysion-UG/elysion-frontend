"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Edit,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Loader2,
  Truck,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  Award,
  ExternalLink,
} from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { ProductService } from "@/src/services/product.service"
import { SellerOrderService } from "@/src/services/seller-order.service"
import { CertificateService } from "@/src/services/certificate.service"
import ProductForm from "@/src/components/ProductForm"
import type {
  ProductListItem,
  ProductStatus,
  OrderGroupDetail,
  OrderGroupStatus,
  Settlement,
  Certificate,
  CertificateStatus,
  CertificateType,
} from "@/src/types"
import { formatEuro } from "@/src/lib/currency"
import { toast } from "sonner"

type Tab = "products" | "orders" | "settlements" | "certificates"

const certStatusLabel: Record<CertificateStatus, string> = {
  PENDING: "Ausstehend",
  VERIFIED: "Verifiziert",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
}

const certStatusColor: Record<CertificateStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-100 text-slate-500",
}

const CERT_TYPES: CertificateType[] = ["ORGANIC", "FAIR_TRADE", "RECYCLED", "VEGAN"]

const productStatusLabel: Record<ProductStatus, string> = {
  DRAFT: "Entwurf",
  REVIEW: "Wird geprüft",
  ACTIVE: "Aktiv",
  INACTIVE: "Inaktiv",
  REJECTED: "Abgelehnt",
}

const productStatusColor: Record<ProductStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  REVIEW: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  REJECTED: "bg-red-100 text-red-700",
}

const orderStatusLabel: Record<OrderGroupStatus, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestätigt",
  PROCESSING: "In Bearbeitung",
  SHIPPED: "Versandt",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
}

const orderStatusColor: Record<OrderGroupStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-orange-100 text-orange-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

// ── Ship Modal ──────────────────────────────────────────────────────────────

function ShipModal({
  groupId,
  onClose,
  onDone,
}: {
  groupId: string
  onClose: () => void
  onDone: () => void
}) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Bitte Trackingnummer eingeben.")
      return
    }
    setIsSaving(true)
    try {
      await SellerOrderService.ship(groupId, { trackingNumber, carrier })
      toast.success("Als versandt markiert.")
      onDone()
    } catch {
      toast.error("Fehler beim Versenden.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Versanddetails</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Trackingnummer *
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="z.B. 1Z999AA10123456784"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Versanddienstleister
            </label>
            <input
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="z.B. DHL, UPS, DPD"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Versandt"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CertForm Modal ───────────────────────────────────────────────────────────

function CertForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [certType, setCertType] = useState<CertificateType>("ORGANIC")
  const [title, setTitle] = useState("")
  const [issuerName, setIssuerName] = useState("")
  const [certNumber, setCertNumber] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Bitte Titel eingeben.")
      return
    }
    setIsSaving(true)
    try {
      await CertificateService.create({
        certificateType: certType,
        title: title.trim(),
        issuerName: issuerName.trim() || undefined,
        certificateNumber: certNumber.trim() || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
      })
      toast.success("Zertifikat erstellt und zur Prüfung eingereicht.")
      onSaved()
    } catch {
      toast.error("Fehler beim Erstellen.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Neues Zertifikat</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Typ</label>
            <select
              value={certType}
              onChange={(e) => setCertType(e.target.value as CertificateType)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CERT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="OTHER">Sonstige</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. EU Bio-Siegel"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Aussteller</label>
              <input
                type="text"
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
                placeholder="z.B. DE-ÖKO-001"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Zertifikatnr.</label>
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="Nr."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Ausstellungsdatum
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Ablaufdatum</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Notizen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-3 w-3 animate-spin" />} Erstellen
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function SellerDashboard() {
  const { user, sellerStatus } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("products")
  const isApproved = sellerStatus === "APPROVED"

  // ── Products ────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductListItem | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!user?.id || !isApproved) return
    setProductsLoading(true)
    try {
      const page = await ProductService.list({ sellerId: user.id, size: 100 })
      setProducts(page.content)
    } catch {
      toast.error("Produkte konnten nicht geladen werden.")
    } finally {
      setProductsLoading(false)
    }
  }, [user?.id, isApproved])

  useEffect(() => {
    if (activeTab === "products") fetchProducts()
  }, [activeTab, fetchProducts])

  const handleStatusChange = async (productId: string, status: ProductStatus) => {
    try {
      await ProductService.updateStatus(productId, { status })
      toast.success(`Status auf "${productStatusLabel[status]}" gesetzt.`)
      fetchProducts()
    } catch {
      toast.error("Status konnte nicht geändert werden.")
    }
  }

  // ── Orders ──────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<OrderGroupDetail[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [shipModalGroupId, setShipModalGroupId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      // Backend returns plain array; cast accordingly
      const data = (await SellerOrderService.list({ size: 100 })) as unknown as OrderGroupDetail[]
      setOrders(
        Array.isArray(data)
          ? data
          : ((data as unknown as { content: OrderGroupDetail[] }).content ?? [])
      )
    } catch {
      toast.error("Bestellungen konnten nicht geladen werden.")
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "orders") fetchOrders()
  }, [activeTab, fetchOrders])

  const handleOrderStatus = async (groupId: string, status: string) => {
    try {
      await SellerOrderService.updateStatus(groupId, status)
      toast.success("Status aktualisiert.")
      fetchOrders()
    } catch {
      toast.error("Status konnte nicht geändert werden.")
    }
  }

  const handleDeliver = async (groupId: string) => {
    try {
      await SellerOrderService.deliver(groupId)
      toast.success("Als geliefert markiert.")
      fetchOrders()
    } catch {
      toast.error("Fehler beim Aktualisieren.")
    }
  }

  // ── Certificates ────────────────────────────────────────────────────────────
  const [certs, setCerts] = useState<Certificate[]>([])
  const [certsLoading, setCertsLoading] = useState(false)
  const [showCertForm, setShowCertForm] = useState(false)

  const fetchCerts = useCallback(async () => {
    setCertsLoading(true)
    try {
      const data = await CertificateService.list()
      setCerts(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Zertifikate konnten nicht geladen werden.")
    } finally {
      setCertsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "certificates") fetchCerts()
  }, [activeTab, fetchCerts])

  // ── Settlements ─────────────────────────────────────────────────────────────
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [settlementsLoading, setSettlementsLoading] = useState(false)

  const fetchSettlements = useCallback(async () => {
    setSettlementsLoading(true)
    try {
      const data = await SellerOrderService.listSettlements({ size: 100 })
      setSettlements(
        Array.isArray(data)
          ? (data as unknown as Settlement[])
          : ((data as unknown as { content: Settlement[] }).content ?? [])
      )
    } catch {
      toast.error("Auszahlungen konnten nicht geladen werden.")
    } finally {
      setSettlementsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "settlements") fetchSettlements()
  }, [activeTab, fetchSettlements])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Approval banners */}
      {sellerStatus === "PENDING" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-800">Verkäuferkonto wird geprüft</h3>
            <p className="mt-1 text-sm text-amber-700">
              Ihr Konto wartet auf Genehmigung durch einen Administrator.
            </p>
          </div>
        </div>
      )}
      {sellerStatus === "REJECTED" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">Verkäuferkonto abgelehnt</h3>
            <p className="mt-1 text-sm text-red-700">
              Ihr Antrag wurde abgelehnt. Bitte kontaktieren Sie den Support.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-slate-800">Verkäufer Dashboard</h1>
        <p className="text-slate-600">
          Verwalten Sie Ihre nachhaltigen Produkte und verfolgen Sie Ihre Verkäufe.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            { key: "products", label: "Produkte", icon: Package },
            { key: "orders", label: "Bestellungen", icon: TrendingUp },
            { key: "certificates", label: "Zertifikate", icon: Award },
            { key: "settlements", label: "Auszahlungen", icon: DollarSign },
          ] as { key: Tab; label: string; icon: React.ElementType }[]
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Products Tab ── */}
      {activeTab === "products" && (
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Produkt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Preis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((product) => {
                    const status = (product as unknown as { status: ProductStatus }).status as
                      | ProductStatus
                      | undefined
                    return (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100">
                              <Package className="h-5 w-5 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{product.title}</p>
                              <p className="text-xs text-slate-400">
                                ID: {product.id.slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {formatEuro(product.price ?? 0)}
                        </td>
                        <td className="px-6 py-4">
                          {status ? (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${productStatusColor[status]}`}
                            >
                              {productStatusLabel[status]}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">–</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
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
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Orders Tab ── */}
      {activeTab === "orders" && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800">Eingehende Bestellungen</h2>
            <button
              onClick={fetchOrders}
              className="text-slate-400 transition-colors hover:text-slate-600"
            >
              <RefreshCw className={`h-4 w-4 ${ordersLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Noch keine Bestellungen.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {orders.map((group) => (
                <div key={group.id} className="p-6">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">#{group.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {group.items?.length ?? 0} Artikel ·{" "}
                        {formatEuro((group.subtotalCents ?? 0) / 100)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${orderStatusColor[group.status]}`}
                    >
                      {orderStatusLabel[group.status]}
                    </span>
                  </div>

                  {/* Shipment info */}
                  {group.shipment?.trackingNumber && (
                    <p className="mb-3 flex items-center gap-1 text-xs text-slate-500">
                      <Truck className="h-3 w-3" />
                      {group.shipment.trackingNumber}{" "}
                      {group.shipment.carrier ? `(${group.shipment.carrier})` : ""}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {group.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleOrderStatus(group.id, "PROCESSING")}
                        className="rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-800 hover:bg-orange-200"
                      >
                        In Bearbeitung
                      </button>
                    )}
                    {group.status === "PROCESSING" && (
                      <button
                        onClick={() => setShipModalGroupId(group.id)}
                        className="flex items-center gap-1 rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-800 hover:bg-purple-200"
                      >
                        <Truck className="h-3 w-3" /> Versenden
                      </button>
                    )}
                    {group.status === "SHIPPED" && (
                      <button
                        onClick={() => handleDeliver(group.id)}
                        className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-200"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Geliefert
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Certificates Tab ── */}
      {activeTab === "certificates" && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Meine Zertifikate</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Nachhaltigkeitsnachweise für Ihre Produkte
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchCerts}
                className="text-slate-400 transition-colors hover:text-slate-600"
                title="Aktualisieren"
              >
                <RefreshCw className={`h-4 w-4 ${certsLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowCertForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" /> Zertifikat hinzufügen
              </button>
            </div>
          </div>

          {certsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : certs.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="mb-2 text-lg font-semibold text-slate-800">Noch keine Zertifikate</h3>
              <p className="mb-4 text-slate-500">
                Fügen Sie Nachhaltigkeitszertifikate hinzu, um Ihre Produkte zu qualifizieren.
              </p>
              <button
                onClick={() => setShowCertForm(true)}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Erstes Zertifikat hinzufügen
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {certs.map((cert) => (
                <div key={cert.id} className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100">
                    <Award className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-800">{cert.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${certStatusColor[cert.status]}`}
                      >
                        {certStatusLabel[cert.status]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {cert.certificateType}
                      </span>
                    </div>
                    {cert.issuerName && (
                      <p className="mt-0.5 text-sm text-slate-500">{cert.issuerName}</p>
                    )}
                    {cert.rejectionReason && (
                      <p className="mt-1 text-xs text-red-600">Abgelehnt: {cert.rejectionReason}</p>
                    )}
                    {cert.expiryDate && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Gültig bis: {new Date(cert.expiryDate).toLocaleDateString("de-DE")}
                      </p>
                    )}
                    {cert.documentUrl && (
                      <a
                        href={cert.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                      >
                        <ExternalLink className="h-3 w-3" /> Dokument ansehen
                      </a>
                    )}
                    {cert.status === "VERIFIED" && (
                      <p className="mt-1 text-xs text-slate-400">
                        Zum Produkt verknüpfen: Produktbearbeitung → Zertifikate
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Settlements Tab ── */}
      {activeTab === "settlements" && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-800">Auszahlungen</h2>
            <button
              onClick={fetchSettlements}
              className="text-slate-400 transition-colors hover:text-slate-600"
            >
              <RefreshCw className={`h-4 w-4 ${settlementsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {settlementsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="py-12 text-center">
              <DollarSign className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Noch keine Auszahlungen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Zeitraum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Brutto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Plattformgebühr
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Netto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(s.periodStart).toLocaleDateString("de-DE")} –{" "}
                        {new Date(s.periodEnd).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800">
                        {formatEuro(s.grossAmountCents / 100)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatEuro(s.platformFeeCents / 100)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-teal-700">
                        {formatEuro(s.netAmountCents / 100)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : s.status === "PENDING"
                                ? "bg-amber-100 text-amber-700"
                                : s.status === "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ship modal */}
      {shipModalGroupId && (
        <ShipModal
          groupId={shipModalGroupId}
          onClose={() => setShipModalGroupId(null)}
          onDone={() => {
            setShipModalGroupId(null)
            fetchOrders()
          }}
        />
      )}

      {/* Product form modal */}
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

      {/* Certificate form modal */}
      {showCertForm && (
        <CertForm
          onClose={() => setShowCertForm(false)}
          onSaved={() => {
            setShowCertForm(false)
            fetchCerts()
          }}
        />
      )}
    </div>
  )
}
