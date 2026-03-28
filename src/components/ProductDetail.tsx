"use client"

import { useState } from "react"
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  Recycle,
  ArrowLeft,
  Plus,
  Minus,
  MapPin,
  Award,
  ExternalLink,
} from "lucide-react"

type Product = {
  id: number
  name: string
  brand: string
  description: string
  longDescription: string
  price: number
  originalPrice: number
  category: string
  images: string[]
  attributes: string[]
  rating: number
  reviews: number
  inStock: boolean
  sizes: string[]
  colors: string[]
}

type Producer = {
  id: string
  name: string
  description: string
  location: string
  foundedYear: number
  employeeCount: number
  certifications: string[]
  sustainabilityScore: number
}

export default function ProductDetail() {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("details")

  // Sample product data
  const product: Product = {
    id: 1,
    name: "Organic Cotton T-Shirt",
    brand: "EcoWear",
    description: "100% organic cotton, ethically made in fair trade certified facilities",
    longDescription:
      "This premium organic cotton t-shirt is crafted from GOTS-certified organic cotton, ensuring no harmful chemicals were used in its production. Made in fair trade certified facilities that guarantee fair wages and safe working conditions for all workers. The production process is carbon neutral, and the packaging is 100% recyclable.",
    price: 29.99,
    originalPrice: 29.99,
    category: "T-Shirts",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop&sat=-100",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop&brightness=110",
    ],
    attributes: ["produktqualitaet", "oekologische", "soziale", "oekonomische", "kulturelle"],
    rating: 4.8,
    reviews: 124,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["White", "Black", "Navy", "Forest Green"],
  }

  // Sample producer data
  const producer: Producer = {
    id: "ecowear",
    name: "EcoWear",
    description: "Sustainable fashion brand committed to ethical production",
    location: "Berlin, Germany",
    foundedYear: 2015,
    employeeCount: 120,
    certifications: ["GOTS", "Fair Trade", "B Corp"],
    sustainabilityScore: 92,
  }

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change))
  }

  const handleAddToCart = () => {
    alert("Product added to cart!")
  }

  const handleNavigateToProducer = () => {
    window.location.href = `/producer?id=${producer.id}`
  }

  const handleGoBack = () => {
    window.location.href = "/"
  }

  const getSustainabilityIcon = (attribute: string) => {
    switch (attribute) {
      case "produktqualitaet":
        return "퀄"
      case "oekologische":
        return "Ö"
      case "soziale":
        return "S"
      case "oekonomische":
        return "Ö"
      case "kulturelle":
        return "K"
      case "fair-trade":
        return "⚖️"
      case "locally-sourced":
        return "📍"
      case "vegan":
        return "🌿"
      case "plastic-free":
        return "🚫"
      default:
        return "✅"
    }
  }

  const getSustainabilityLabel = (attribute: string) => {
    const labels: Record<string, string> = {
      produktqualitaet: "Produktqualität",
      oekologische: "Ökologische Nachhaltigkeit",
      oekonomische: "Ökonomische Nachhaltigkeit",
      soziale: "Soziale Nachhaltigkeit",
      kulturelle: "Kulturelle Nachhaltigkeit",
      politische: "Politische Nachhaltigkeit",
      technologische: "Technologische Nachhaltigkeit",
      institutionelle: "Institutionelle Nachhaltigkeit",
    }
    return labels[attribute] || attribute
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="mb-6 flex items-center gap-2 text-slate-700 transition-colors hover:text-teal-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Produkten
        </button>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <img
                src={product.images[selectedImageIndex] || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImageIndex === index ? "border-teal-600" : "border-slate-200"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                  {product.category}
                </span>
                {!product.inStock && (
                  <span className="inline-flex items-center rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                    Nicht verfügbar
                  </span>
                )}
              </div>

              <button
                onClick={handleNavigateToProducer}
                className="mb-1 flex items-center gap-1 text-sm font-medium text-teal-600 transition-colors hover:text-teal-700 hover:underline"
              >
                {product.brand}
                <ExternalLink className="h-3 w-3" />
              </button>

              <h1 className="mb-2 text-3xl font-bold text-slate-800">{product.name}</h1>
              <p className="text-lg text-slate-600">{product.description}</p>
            </div>

            {/* Producer Preview Card */}
            <div
              onClick={handleNavigateToProducer}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-teal-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                    <span className="text-lg font-bold text-teal-700">
                      {producer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{producer.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="h-3 w-3" />
                      {producer.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-teal-700">
                    <Award className="h-4 w-4" />
                    <span className="font-semibold">{producer.sustainabilityScore}%</span>
                  </div>
                  <span className="text-xs text-slate-600">Nachhaltigkeits-Score</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {producer.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? "fill-current text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-slate-700">{product.rating}</span>
              <span className="text-slate-600">({product.reviews} Bewertungen)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-800">€{product.price.toFixed(2)}</span>
            </div>

            {/* Sustainability Attributes */}
            <div>
              <h3 className="mb-3 text-lg font-semibold text-slate-800">Nachhaltigkeitsmerkmale</h3>
              <div className="flex flex-wrap gap-2">
                {product.attributes.map((attribute) => (
                  <span
                    key={attribute}
                    className="inline-flex items-center gap-1 rounded-full border border-teal-300 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700"
                  >
                    {getSustainabilityLabel(attribute)}
                  </span>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-slate-800">Größe</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-lg border px-4 py-2 font-medium transition-colors ${
                        selectedSize === size
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 text-slate-700 hover:border-teal-600"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-slate-800">Farbe</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-lg border px-4 py-2 font-medium transition-colors ${
                        selectedColor === color
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 text-slate-700 hover:border-teal-600"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="mb-3 text-lg font-semibold text-slate-800">Menge</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2rem] text-center text-lg font-medium text-slate-800">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <ShoppingCart className="h-5 w-5" />
                {product.inStock ? "In den Warenkorb" : "Nicht verfügbar"}
              </button>
              <button className="flex items-center justify-center rounded-lg border border-teal-600 px-6 py-3 font-medium text-teal-600 transition-colors hover:bg-teal-50">
                <Heart className="h-5 w-5" />
              </button>
            </div>

            {/* Shipping Info */}
            <div className="space-y-2 rounded-lg bg-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <Truck className="h-5 w-5" />
                <span className="font-medium">Kostenloser Versand ab €50</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Shield className="h-5 w-5" />
                <span className="font-medium">30 Tage Rückgaberecht</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Recycle className="h-5 w-5" />
                <span className="font-medium">CO2-neutraler Versand</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8">
              {["details", "sustainability", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 px-1 py-4 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-slate-700 hover:border-slate-300 hover:text-teal-600"
                  }`}
                >
                  {tab === "details"
                    ? "Details"
                    : tab === "sustainability"
                      ? "Nachhaltigkeit"
                      : `Bewertungen (${product.reviews})`}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === "details" && (
              <div className="prose max-w-none">
                <p className="leading-relaxed text-slate-700">{product.longDescription}</p>
              </div>
            )}

            {activeTab === "sustainability" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-800">
                  Unser Nachhaltigkeitsversprechen
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {product.attributes.map((attribute) => (
                    <div key={attribute} className="rounded-lg bg-slate-100 p-4">
                      <div className="mb-2 flex items-center gap-3">
                        <h4 className="font-semibold text-slate-800">
                          {getSustainabilityLabel(attribute)}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-700">
                        Dieses Produkt erfüllt unsere strengen Standards für{" "}
                        {getSustainabilityLabel(attribute)}.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-800">Kundenbewertungen</h3>
                  <button className="rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700">
                    Bewertung schreiben
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                        ))}
                      </div>
                      <span className="font-medium text-slate-800">Sarah M.</span>
                      <span className="text-sm text-teal-600">Verifizierter Kauf</span>
                    </div>
                    <p className="text-slate-700">
                      "Tolle Qualität und super weich! Ich liebe es zu wissen, dass es ethisch
                      hergestellt wurde. Werde definitiv mehr Farben kaufen."
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                        ))}
                        <Star className="h-4 w-4 text-gray-300" />
                      </div>
                      <span className="font-medium text-slate-800">Mike R.</span>
                      <span className="text-sm text-teal-600">Verifizierter Kauf</span>
                    </div>
                    <p className="text-slate-700">
                      "Gute Passform und bequem. Die Bio-Baumwolle fühlt sich wirklich toll an."
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
