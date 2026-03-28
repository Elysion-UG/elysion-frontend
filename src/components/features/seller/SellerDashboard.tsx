"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Plus, Edit, Package, DollarSign, TrendingUp, AlertTriangle, Clock, Loader2, Truck, CheckCircle2, RefreshCw, BarChart3, Award, ExternalLink } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import { ProductService } from "@/src/services/product.service"
import { SellerOrderService } from "@/src/services/seller-order.service"
import { CertificateService } from "@/src/services/certificate.service"
import ProductForm from "@/src/components/ProductForm"
import type { ProductListItem, ProductStatus, OrderGroupDetail, OrderGroupStatus, Settlement, Certificate, CertificateStatus, CertificateType } from "@/src/types"
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

function ShipModal({ groupId, onClose, onDone }: { groupId: string; onClose: () => void; onDone: () => void }) {
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Versanddetails</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trackingnummer *</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="z.B. 1Z999AA10123456784"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Versanddienstleister</label>
            <input
              type="text"
              value={carrier}
              onChange={e => setCarrier(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="z.B. DHL, UPS, DPD"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Versandt"}
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
    if (!title.trim()) { toast.error("Bitte Titel eingeben."); return }
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
    } catch { toast.error("Fehler beim Erstellen.") }
    finally { setIsSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Neues Zertifikat</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Typ</label>
            <select value={certType} onChange={e => setCertType(e.target.value as CertificateType)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
              {CERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="OTHER">Sonstige</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Titel *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. EU Bio-Siegel" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Aussteller</label>
              <input type="text" value={issuerName} onChange={e => setIssuerName(e.target.value)} placeholder="z.B. DE-ÖKO-001" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Zertifikatnr.</label>
              <input type="text" value={certNumber} onChange={e => setCertNumber(e.target.value)} placeholder="Nr." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ausstellungsdatum</label>
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ablaufdatum</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notizen</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Abbrechen</button>
          <button onClick={handleSubmit} disabled={isSaving} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {isSaving && <Loader2 className="w-3 h-3 animate-spin" />} Erstellen
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
      const data = await SellerOrderService.list({ size: 100 }) as unknown as OrderGroupDetail[]
      setOrders(Array.isArray(data) ? data : (data as unknown as { content: OrderGroupDetail[] }).content ?? [])
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
    } catch { toast.error("Zertifikate konnten nicht geladen werden.") }
    finally { setCertsLoading(false) }
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
      setSettlements(Array.isArray(data) ? data as unknown as Settlement[] : (data as unknown as { content: Settlement[] }).content ?? [])
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
        <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800">Verkäuferkonto wird geprüft</h3>
            <p className="text-sm text-amber-700 mt-1">Ihr Konto wartet auf Genehmigung durch einen Administrator.</p>
          </div>
        </div>
      )}
      {sellerStatus === "REJECTED" && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Verkäuferkonto abgelehnt</h3>
            <p className="text-sm text-red-700 mt-1">Ihr Antrag wurde abgelehnt. Bitte kontaktieren Sie den Support.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Verkäufer Dashboard</h1>
        <p className="text-slate-600">Verwalten Sie Ihre nachhaltigen Produkte und verfolgen Sie Ihre Verkäufe.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit flex-wrap">
        {([
          { key: "products", label: "Produkte", icon: Package },
          { key: "orders", label: "Bestellungen", icon: TrendingUp },
          { key: "certificates", label: "Zertifikate", icon: Award },
          { key: "settlements", label: "Auszahlungen", icon: DollarSign },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Products Tab ── */}
      {activeTab === "products" && (
        <div className={`bg-white rounded-xl border border-slate-200 ${!isApproved ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Ihre Produkte</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchProducts}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Aktualisieren"
              >
                <RefreshCw className={`w-4 h-4 ${productsLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                disabled={!isApproved}
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors text-sm font-medium"
                onClick={() => { setEditProduct(null); setShowProductForm(true) }}
              >
                <Plus className="w-4 h-4" /> Neues Produkt
              </button>
            </div>
          </div>

          {productsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-teal-600 animate-spin" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Noch keine Produkte</h3>
              <p className="text-slate-500">Fügen Sie Ihr erstes nachhaltiges Produkt hinzu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Produkt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Preis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((product) => {
                    const status = (product as unknown as { status: ProductStatus }).status as ProductStatus | undefined
                    return (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{product.title}</p>
                              <p className="text-xs text-slate-400">ID: {product.id.slice(0, 8)}…</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{formatEuro(product.price)}</td>
                        <td className="px-6 py-4">
                          {status ? (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${productStatusColor[status]}`}>
                              {productStatusLabel[status]}
                            </span>
                          ) : <span className="text-xs text-slate-400">–</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditProduct(product); setShowProductForm(true) }}
                              className="text-teal-600 hover:text-teal-800 transition-colors"
                              title="Bearbeiten"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {status === "DRAFT" && (
                              <button
                                onClick={() => handleStatusChange(product.id, "REVIEW")}
                                className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded hover:bg-amber-200"
                              >
                                Zur Prüfung
                              </button>
                            )}
                            {status === "ACTIVE" && (
                              <button
                                onClick={() => handleStatusChange(product.id, "INACTIVE")}
                                className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded hover:bg-slate-200"
                              >
                                Deaktivieren
                              </button>
                            )}
                            {status === "INACTIVE" && (
                              <button
                                onClick={() => handleStatusChange(product.id, "ACTIVE")}
                                className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded hover:bg-emerald-200"
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
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Eingehende Bestellungen</h2>
            <button onClick={fetchOrders} className="text-slate-400 hover:text-slate-600 transition-colors">
              <RefreshCw className={`w-4 h-4 ${ordersLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-teal-600 animate-spin" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Noch keine Bestellungen.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {orders.map((group) => (
                <div key={group.id} className="p-6">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">#{group.orderNumber}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{group.items?.length ?? 0} Artikel · {formatEuro((group.subtotalCents ?? 0) / 100)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${orderStatusColor[group.status]}`}>
                      {orderStatusLabel[group.status]}
                    </span>
                  </div>

                  {/* Shipment info */}
                  {group.shipment?.trackingNumber && (
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      {group.shipment.trackingNumber} {group.shipment.carrier ? `(${group.shipment.carrier})` : ""}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {group.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleOrderStatus(group.id, "PROCESSING")}
                        className="text-xs bg-orange-100 text-orange-800 px-3 py-1.5 rounded-lg hover:bg-orange-200 font-medium"
                      >
                        In Bearbeitung
                      </button>
                    )}
                    {group.status === "PROCESSING" && (
                      <button
                        onClick={() => setShipModalGroupId(group.id)}
                        className="text-xs bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg hover:bg-purple-200 font-medium flex items-center gap-1"
                      >
                        <Truck className="w-3 h-3" /> Versenden
                      </button>
                    )}
                    {group.status === "SHIPPED" && (
                      <button
                        onClick={() => handleDeliver(group.id)}
                        className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-lg hover:bg-green-200 font-medium flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Geliefert
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
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Meine Zertifikate</h2>
              <p className="text-sm text-slate-500 mt-0.5">Nachhaltigkeitsnachweise für Ihre Produkte</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchCerts} className="text-slate-400 hover:text-slate-600 transition-colors" title="Aktualisieren">
                <RefreshCw className={`w-4 h-4 ${certsLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowCertForm(true)}
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Zertifikat hinzufügen
              </button>
            </div>
          </div>

          {certsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-teal-600 animate-spin" /></div>
          ) : certs.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Noch keine Zertifikate</h3>
              <p className="text-slate-500 mb-4">Fügen Sie Nachhaltigkeitszertifikate hinzu, um Ihre Produkte zu qualifizieren.</p>
              <button onClick={() => setShowCertForm(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
                Erstes Zertifikat hinzufügen
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {certs.map(cert => (
                <div key={cert.id} className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-800">{cert.title}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${certStatusColor[cert.status]}`}>
                        {certStatusLabel[cert.status]}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cert.certificateType}</span>
                    </div>
                    {cert.issuerName && <p className="text-sm text-slate-500 mt-0.5">{cert.issuerName}</p>}
                    {cert.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">Abgelehnt: {cert.rejectionReason}</p>
                    )}
                    {cert.expiryDate && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Gültig bis: {new Date(cert.expiryDate).toLocaleDateString("de-DE")}
                      </p>
                    )}
                    {cert.documentUrl && (
                      <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 mt-1">
                        <ExternalLink className="w-3 h-3" /> Dokument ansehen
                      </a>
                    )}
                    {cert.status === "VERIFIED" && (
                      <p className="text-xs text-slate-400 mt-1">
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
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Auszahlungen</h2>
            <button onClick={fetchSettlements} className="text-slate-400 hover:text-slate-600 transition-colors">
              <RefreshCw className={`w-4 h-4 ${settlementsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {settlementsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-teal-600 animate-spin" /></div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Noch keine Auszahlungen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Zeitraum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Brutto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plattformgebühr</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Netto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(s.periodStart).toLocaleDateString("de-DE")} – {new Date(s.periodEnd).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800">{formatEuro(s.grossAmountCents / 100)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatEuro(s.platformFeeCents / 100)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-teal-700">{formatEuro(s.netAmountCents / 100)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          s.status === "PAID" ? "bg-green-100 text-green-700"
                          : s.status === "PENDING" ? "bg-amber-100 text-amber-700"
                          : s.status === "FAILED" ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                        }`}>{s.status}</span>
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
          onDone={() => { setShipModalGroupId(null); fetchOrders() }}
        />
      )}

      {/* Product form modal */}
      {showProductForm && (
        <ProductForm
          productId={editProduct?.id}
          initialValues={editProduct ? { name: editProduct.title, basePrice: editProduct.price } : undefined}
          onClose={() => { setShowProductForm(false); setEditProduct(null) }}
          onSaved={() => { setShowProductForm(false); setEditProduct(null); fetchProducts() }}
        />
      )}

      {/* Certificate form modal */}
      {showCertForm && (
        <CertForm
          onClose={() => setShowCertForm(false)}
          onSaved={() => { setShowCertForm(false); fetchCerts() }}
        />
      )}
    </div>
  )
}
