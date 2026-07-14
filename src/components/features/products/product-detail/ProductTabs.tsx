"use client"

import { useState } from "react"
import type { ProductDetail, ProductVariant, PublicCertificate } from "@/src/types"
import { CertificatePanel } from "./CertificatePanel"

interface ProductTabsProps {
  product: ProductDetail
  selectedVariant: ProductVariant | null
  certificates: PublicCertificate[]
}

type TabId = "details" | "sustainability"

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "details", label: "Details" },
  { id: "sustainability", label: "Nachhaltigkeit" },
]

export function ProductTabs({ product, selectedVariant, certificates }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("details")

  return (
    <div className="mt-12">
      <div className="border-b border-border">
        <nav className="flex gap-1" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`border-b-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="py-8">
        {activeTab === "details" && <DetailsPanel product={product} variant={selectedVariant} />}
        {activeTab === "sustainability" && <CertificatePanel certificates={certificates} />}
      </div>
    </div>
  )
}

function DetailsPanel({
  product,
  variant,
}: {
  product: ProductDetail
  variant: ProductVariant | null
}) {
  return (
    <div className="space-y-6">
      <p className="leading-relaxed text-foreground">
        {product.description ?? "Keine Beschreibung vorhanden."}
      </p>
      {variant && (
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {variant.sku && (
            <div className="rounded-lg border border-border bg-secondary px-3 py-2">
              <p className="text-xs text-muted-foreground">SKU</p>
              <p className="font-medium text-foreground">{variant.sku}</p>
            </div>
          )}
          {variant.material && (
            <div className="rounded-lg border border-border bg-secondary px-3 py-2">
              <p className="text-xs text-muted-foreground">Material</p>
              <p className="font-medium text-foreground">{variant.material}</p>
            </div>
          )}
          {variant.stock !== undefined && (
            <div className="rounded-lg border border-border bg-secondary px-3 py-2">
              <p className="text-xs text-muted-foreground">Lagerbestand</p>
              <p className="font-medium text-foreground">{variant.stock} Stück</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
