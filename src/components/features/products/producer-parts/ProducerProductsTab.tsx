"use client"

import Image from "next/image"
import { ShoppingCart, Star } from "lucide-react"
import type { Producer, ProducerProduct } from "./producer-mock"

interface ProducerProductsTabProps {
  producer: Producer
  products: ProducerProduct[]
  onProductClick: (productId: number) => void
}

export function ProducerProductsTab({
  producer,
  products,
  onProductClick,
}: ProducerProductsTabProps) {
  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-slate-800">Produkte von {producer.name}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => onProductClick(product.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onProductClick(product.id)
              }
            }}
            className="group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:border-teal-400 hover:shadow-lg"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
            <div className="p-4">
              <span className="text-xs font-medium text-teal-600">{product.category}</span>
              <h3 className="mt-1 font-semibold text-slate-800">{product.name}</h3>
              <div className="mt-2 flex items-center gap-1">
                <Star className="h-4 w-4 fill-current text-yellow-400" />
                <span className="text-sm text-slate-700">{product.rating}</span>
                <span className="text-sm text-slate-500">({product.reviews})</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">
                  €{product.price.toFixed(2)}
                </span>
                <button
                  aria-label={`${product.name} in den Warenkorb`}
                  className="rounded-full p-2 text-teal-600 transition-colors hover:bg-teal-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
