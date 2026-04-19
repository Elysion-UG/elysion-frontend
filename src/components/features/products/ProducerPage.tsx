"use client"

import { useRouter } from "next/navigation"
import {
  MOCK_PRODUCER,
  MOCK_PRODUCER_PRODUCTS,
  ProducerAboutTab,
  ProducerHeader,
  ProducerHero,
  ProducerProductsTab,
  ProducerSustainabilityTab,
  ProducerTabs,
  useProducerTabs,
} from "./producer-parts"

export default function ProducerPage() {
  const router = useRouter()
  const { activeTab, setActiveTab, tabs } = useProducerTabs()

  const producer = MOCK_PRODUCER
  const products = MOCK_PRODUCER_PRODUCTS

  return (
    <div className="min-h-screen bg-slate-50">
      <ProducerHero
        image={producer.heroImage}
        alt={`${producer.name} banner`}
        onBack={() => router.back()}
      />

      <div className="container mx-auto px-4">
        <ProducerHeader producer={producer} />

        <div className="mb-8 rounded-xl bg-white shadow-sm">
          <ProducerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="p-6 md:p-8">
            {activeTab === "about" && <ProducerAboutTab producer={producer} />}
            {activeTab === "products" && (
              <ProducerProductsTab
                producer={producer}
                products={products}
                onProductClick={(id) => router.push(`/product?id=${id}`)}
              />
            )}
            {activeTab === "sustainability" && <ProducerSustainabilityTab producer={producer} />}
          </div>
        </div>
      </div>
    </div>
  )
}
