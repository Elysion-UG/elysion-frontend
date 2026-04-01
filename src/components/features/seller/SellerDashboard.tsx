"use client"

import React, { useState } from "react"
import { Package, DollarSign, TrendingUp, Clock, Award } from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import SellerProductsTab from "./SellerProductsTab"
import SellerOrdersTab from "./SellerOrdersTab"
import SellerCertificatesTab from "./SellerCertificatesTab"
import SellerSettlementsTab from "./SellerSettlementsTab"
import type { Tab } from "./sellerDashboard.constants"

export default function SellerDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("products")
  // Backend sets role="SELLER" on approve, role="BUYER" on reject/suspend —
  // so role is the reliable approval signal (sellerProfile.status is not returned by the API).
  const isApproved = user?.role === "SELLER"
  const isPending = !isApproved

  return (
    <div>
      {/* Approval banners */}
      {isPending && (
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

      {/* Tab content */}
      {activeTab === "products" && <SellerProductsTab isApproved={isApproved} userId={user?.id} />}
      {activeTab === "orders" && <SellerOrdersTab />}
      {activeTab === "certificates" && <SellerCertificatesTab />}
      {activeTab === "settlements" && <SellerSettlementsTab />}
    </div>
  )
}
