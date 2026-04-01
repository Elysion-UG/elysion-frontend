"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Award,
  Star,
  ExternalLink,
  Mail,
  Globe,
  Leaf,
  ShoppingCart,
} from "lucide-react"

type Producer = {
  id: string
  name: string
  description: string
  longDescription: string
  location: string
  country: string
  foundedYear: number
  employeeCount: number
  certifications: string[]
  sustainabilityScore: number
  sustainabilityAttributes: string[]
  email: string
  website: string
  heroImage: string
  logoInitial: string
}

type Product = {
  id: number
  name: string
  price: number
  image: string
  rating: number
  reviews: number
  category: string
}

export default function ProducerPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("about")

  const producer: Producer = {
    id: "ecowear",
    name: "EcoWear",
    description: "Nachhaltige Modemarke mit Fokus auf ethische Produktion und Umweltverantwortung.",
    longDescription: `EcoWear wurde 2015 mit einer einfachen Mission gegründet: zu beweisen, dass Mode sowohl stilvoll als auch nachhaltig sein kann. Mit Sitz in Berlin arbeiten wir direkt mit Bio-Baumwollbauern und Fair-Trade-zertifizierten Fabriken zusammen, um Kleidung zu schaffen, die gut aussieht und Gutes tut.

Unser Engagement für Nachhaltigkeit geht über die Verwendung von Bio-Materialien hinaus. Wir haben ein geschlossenes Produktionssystem implementiert, das Abfall minimiert, nutzen erneuerbare Energien in unseren Einrichtungen und gleichen alle verbleibenden CO2-Emissionen durch verifizierte Aufforstungsprojekte aus.

Jedes EcoWear-Kleidungsstück ist auf Langlebigkeit ausgelegt, wodurch der Bedarf an häufigem Ersatz und die damit verbundenen Umweltauswirkungen von Fast Fashion reduziert werden. Wir glauben an Transparenz und veröffentlichen jährliche Nachhaltigkeitsberichte, in denen unsere Umweltauswirkungen und Ziele detailliert beschrieben werden.`,
    location: "Berlin",
    country: "Deutschland",
    foundedYear: 2015,
    employeeCount: 120,
    certifications: ["GOTS Zertifiziert", "Fair Trade", "B Corp", "Klimaneutral", "OEKO-TEX"],
    sustainabilityScore: 92,
    sustainabilityAttributes: [
      "produktqualitaet",
      "oekologische",
      "soziale",
      "oekonomische",
      "kulturelle",
    ],
    email: "hello@ecowear.com",
    website: "www.ecowear.com",
    heroImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
    logoInitial: "E",
  }

  const producerProducts: Product[] = [
    {
      id: 1,
      name: "Bio-Baumwoll T-Shirt",
      price: 29.99,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
      rating: 4.8,
      reviews: 124,
      category: "T-Shirts",
    },
    {
      id: 2,
      name: "Leinen Sommerkleid",
      price: 79.99,
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop",
      rating: 4.9,
      reviews: 89,
      category: "Kleider",
    },
    {
      id: 3,
      name: "Recycelte Denim Jeans",
      price: 89.99,
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop",
      rating: 4.7,
      reviews: 156,
      category: "Hosen",
    },
    {
      id: 4,
      name: "Bambus-Mix Hoodie",
      price: 65.0,
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop",
      rating: 4.6,
      reviews: 78,
      category: "Oberbekleidung",
    },
  ]

  const handleGoBack = () => {
    router.back()
  }

  const handleProductClick = (productId: number) => {
    router.push(`/product?id=${productId}`)
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
      {/* Hero Section */}
      <div className="relative h-64 md:h-80">
        <img
          src={producer.heroImage || "/placeholder.svg"}
          alt={`${producer.name} banner`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-white transition-colors hover:bg-black/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>
      </div>

      <div className="container mx-auto px-4">
        {/* Producer Header */}
        <div className="relative -mt-16 mb-8">
          <div className="rounded-xl bg-white p-6 shadow-lg md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Logo */}
              <div className="-mt-16 flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border-4 border-white bg-teal-600 shadow-lg md:-mt-20 md:h-32 md:w-32">
                <span className="text-4xl font-bold text-white md:text-5xl">
                  {producer.logoInitial}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800">{producer.name}</h1>
                    <p className="mt-1 text-slate-600">{producer.description}</p>
                  </div>

                  {/* Sustainability Score */}
                  <div className="flex items-center gap-2 rounded-lg bg-teal-100 px-4 py-2">
                    <Leaf className="h-6 w-6 text-teal-600" />
                    <div>
                      <span className="text-2xl font-bold text-teal-700">
                        {producer.sustainabilityScore}%
                      </span>
                      <p className="text-xs text-teal-600">Nachhaltigkeits-Score</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {producer.location}, {producer.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="h-4 w-4" />
                    <span>Gegründet {producer.foundedYear}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Users className="h-4 w-4" />
                    <span>{producer.employeeCount} Mitarbeiter</span>
                  </div>
                </div>

                {/* Certifications */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {producer.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                    >
                      <Award className="h-3 w-3" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 rounded-xl bg-white shadow-sm">
          <div className="border-b border-slate-200">
            <nav className="flex">
              {["about", "products", "sustainability"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-teal-600 bg-teal-50 text-teal-600"
                      : "text-slate-700 hover:bg-slate-50 hover:text-teal-600"
                  }`}
                >
                  {tab === "about"
                    ? "Über uns"
                    : tab === "products"
                      ? "Produkte"
                      : "Nachhaltigkeit"}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 md:p-8">
            {/* About Tab */}
            {activeTab === "about" && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-4 text-xl font-semibold text-slate-800">
                    Über {producer.name}
                  </h2>
                  <div className="prose max-w-none whitespace-pre-line text-slate-700">
                    {producer.longDescription}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="rounded-lg bg-slate-50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-800">
                    Kontaktinformationen
                  </h3>
                  <div className="space-y-3">
                    <a
                      href={`mailto:${producer.email}`}
                      className="flex items-center gap-3 text-slate-700 transition-colors hover:text-teal-600"
                    >
                      <Mail className="h-5 w-5" />
                      {producer.email}
                    </a>
                    <a
                      href={`https://${producer.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-slate-700 transition-colors hover:text-teal-600"
                    >
                      <Globe className="h-5 w-5" />
                      {producer.website}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
              <div>
                <h2 className="mb-6 text-xl font-semibold text-slate-800">
                  Produkte von {producer.name}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {producerProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:border-teal-400 hover:shadow-lg"
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <span className="text-xs font-medium text-teal-600">
                          {product.category}
                        </span>
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
                          <button className="rounded-full p-2 text-teal-600 transition-colors hover:bg-teal-100">
                            <ShoppingCart className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sustainability Tab */}
            {activeTab === "sustainability" && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-4 text-xl font-semibold text-slate-800">
                    Nachhaltigkeitsversprechen
                  </h2>
                  <p className="mb-6 text-slate-700">
                    {producer.name} setzt sich für nachhaltige und ethische Praktiken in allen
                    Geschäftsbereichen ein. Hier sind die Nachhaltigkeitsattribute, die wir
                    erfüllen:
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {producer.sustainabilityAttributes.map((attribute) => (
                    <div key={attribute} className="rounded-lg bg-slate-100 p-6">
                      <div className="mb-3 flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {getSustainabilityLabel(attribute)}
                        </h3>
                      </div>
                      <p className="text-slate-700">
                        {producer.name} erfüllt strenge Standards für{" "}
                        {getSustainabilityLabel(attribute)}, um sicherzustellen, dass unsere
                        Produkte und Praktiken zu einer nachhaltigeren Zukunft beitragen.
                      </p>
                    </div>
                  ))}
                </div>

                {/* Sustainability Score Breakdown */}
                <div className="rounded-lg border border-slate-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-800">
                    Nachhaltigkeits-Score Aufschlüsselung
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: "Umweltauswirkung", score: 95 },
                      { label: "Ethische Arbeitspraktiken", score: 92 },
                      { label: "Lieferketten-Transparenz", score: 88 },
                      { label: "Materialbeschaffung", score: 94 },
                      { label: "Verpackung & Abfall", score: 90 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-slate-700">{item.label}</span>
                          <span className="font-medium text-slate-800">{item.score}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-teal-600 transition-all"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
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
