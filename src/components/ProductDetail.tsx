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
          className="flex items-center gap-2 text-slate-700 hover:text-teal-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zu Produkten
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200">
              <img
                src={product.images[selectedImageIndex] || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index ? "border-teal-600" : "border-slate-200"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800 border-slate-300">
                  {product.category}
                </span>
                {!product.inStock && (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 border-red-300">
                    Nicht verfügbar
                  </span>
                )}
              </div>

              <button
                onClick={handleNavigateToProducer}
                className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors flex items-center gap-1 mb-1"
              >
                {product.brand}
                <ExternalLink className="w-3 h-3" />
              </button>

              <h1 className="text-3xl font-bold text-slate-800 mb-2">{product.name}</h1>
              <p className="text-slate-600 text-lg">{product.description}</p>
            </div>

            {/* Producer Preview Card */}
            <div
              onClick={handleNavigateToProducer}
              className="bg-white rounded-lg p-4 border border-slate-200 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-700 font-bold text-lg">{producer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{producer.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="w-3 h-3" />
                      {producer.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-teal-700">
                    <Award className="w-4 h-4" />
                    <span className="font-semibold">{producer.sustainabilityScore}%</span>
                  </div>
                  <span className="text-xs text-slate-600">Nachhaltigkeits-Score</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {producer.certifications.map((cert) => (
                  <span key={cert} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
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
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-slate-700 font-medium">{product.rating}</span>
              <span className="text-slate-600">({product.reviews} Bewertungen)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-800">€{product.price.toFixed(2)}</span>
            </div>

            {/* Sustainability Attributes */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Nachhaltigkeitsmerkmale</h3>
              <div className="flex flex-wrap gap-2">
                {product.attributes.map((attribute) => (
                  <span
                    key={attribute}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium border-teal-300 text-teal-700 bg-teal-50"
                  >
                    {getSustainabilityLabel(attribute)}
                  </span>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Größe</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
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
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Farbe</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
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
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Menge</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-medium text-slate-800 min-w-[2rem] text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.inStock ? "In den Warenkorb" : "Nicht verfügbar"}
              </button>
              <button className="px-6 py-3 border border-teal-600 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {/* Shipping Info */}
            <div className="bg-slate-100 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Truck className="w-5 h-5" />
                <span className="font-medium">Kostenloser Versand ab €50</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Shield className="w-5 h-5" />
                <span className="font-medium">30 Tage Rückgaberecht</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Recycle className="w-5 h-5" />
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
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${
                    activeTab === tab
                      ? "border-teal-600 text-teal-600"
                      : "border-transparent text-slate-700 hover:text-teal-600 hover:border-slate-300"
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
                <p className="text-slate-700 leading-relaxed">{product.longDescription}</p>
              </div>
            )}

            {activeTab === "sustainability" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-800">Unser Nachhaltigkeitsversprechen</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {product.attributes.map((attribute) => (
                    <div key={attribute} className="bg-slate-100 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-800">{getSustainabilityLabel(attribute)}</h4>
                      </div>
                      <p className="text-slate-700 text-sm">
                        Dieses Produkt erfüllt unsere strengen Standards für {getSustainabilityLabel(attribute)}.
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
                  <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                    Bewertung schreiben
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-6 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="font-medium text-slate-800">Sarah M.</span>
                      <span className="text-teal-600 text-sm">Verifizierter Kauf</span>
                    </div>
                    <p className="text-slate-700">
                      "Tolle Qualität und super weich! Ich liebe es zu wissen, dass es ethisch hergestellt wurde. Werde
                      definitiv mehr Farben kaufen."
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                        <Star className="w-4 h-4 text-gray-300" />
                      </div>
                      <span className="font-medium text-slate-800">Mike R.</span>
                      <span className="text-teal-600 text-sm">Verifizierter Kauf</span>
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
