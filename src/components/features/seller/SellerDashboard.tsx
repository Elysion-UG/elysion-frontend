"use client"

import { useSearchParams } from "next/navigation"
import { Clock } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import SellerProductsTab from "./SellerProductsTab"
import SellerOrdersTab from "./SellerOrdersTab"
import SellerCertificatesTab from "./SellerCertificatesTab"
import SellerSettlementsTab from "./SellerSettlementsTab"
import type { Tab } from "./sellerDashboard.constants"

const PAGE_META: Record<Tab, { title: string; subtitle: string }> = {
  products: { title: "Produkte", subtitle: "Verwalten Sie Ihr Sortiment" },
  orders: { title: "Bestellungen", subtitle: "Eingehende und laufende Bestellungen" },
  certificates: { title: "Zertifikate", subtitle: "Nachhaltigkeitsnachweise für Ihre Produkte" },
  settlements: { title: "Auszahlungen", subtitle: "Erlöse und Abrechnungen" },
}

export default function SellerDashboard() {
  const { user, isLoading } = useAuth()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as Tab) ?? "products"

  // Backend sets role="SELLER" on approve, role="BUYER" on reject/suspend —
  // so role is the reliable approval signal (sellerProfile.status is not returned by the API).
  const isApproved = user?.role === "SELLER"
  const isPending = !isLoading && !isApproved
  const { title, subtitle } = PAGE_META[activeTab] ?? PAGE_META.products

  return (
    <div>
      {/* Approval banner */}
      {isPending && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-800">Verkäuferkonto wird geprüft</h3>
            <p className="mt-1 text-sm text-amber-700">
              Ihr Konto wartet auf Genehmigung durch einen Administrator.
            </p>
          </div>
        </div>
      )}

      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      {/* Tab content */}
      {activeTab === "products" && <SellerProductsTab isApproved={isApproved} userId={user?.id} />}
      {activeTab === "orders" && <SellerOrdersTab />}
      {activeTab === "certificates" && <SellerCertificatesTab />}
      {activeTab === "settlements" && <SellerSettlementsTab />}
    </div>
  )
}
