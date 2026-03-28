"use client"

import type React from "react"

import { useState, useMemo } from "react"
import {
  Leaf,
  Heart,
  Recycle,
  ArrowUpDown,
  Star,
  ChevronDown,
  ChevronRight,
  Settings,
  User,
} from "lucide-react"

type Product = {
  id: number
  name: string
  brand: string
  description: string
  longDescription: string
  price: number
  category: string
  images: string[]
  attributes: string[]
  rating: number
  reviews: number
  inStock: boolean
  sizes: string[]
  colors: string[]
}

type SustainabilityFilter = {
  label: string
  icon: typeof Leaf
  subpoints: string[]
}

const sustainabilityFilters: Record<string, SustainabilityFilter> = {
  produktqualitaet: {
    label: "Produktqualität",
    icon: Star,
    subpoints: ["Qualitätsparameter", "Schadstofffreiheit", "Haltbarkeit"],
  },
  oekologisch: {
    label: "Ökologische Nachhaltigkeit",
    icon: Leaf,
    subpoints: [
      "Schutz von Umwelt, Natur und Ressourcen",
      "Fokus auf Klimaschutz, Artenvielfalt, Ressourcenschonung, Kreislaufwirtschaft",
    ],
  },
  oekonomisch: {
    label: "Ökonomische Nachhaltigkeit",
    icon: Recycle,
    subpoints: [
      "Lieferantenbeziehungen",
      "Faire Löhne in der Lieferkette",
      "Wirtschaftliches Handeln so gestalten, dass es langfristig tragfähig ist",
    ],
  },
  sozial: {
    label: "Soziale Nachhaltigkeit",
    icon: Heart,
    subpoints: [
      "Gerechtigkeit, Chancengleichheit, soziale Sicherheit",
      "Menschenrechte, Bildung, Gesundheit, faire Arbeitsbedingungen",
    ],
  },
  kulturell: {
    label: "Kulturelle Nachhaltigkeit",
    icon: Heart,
    subpoints: [
      "Erhalt kultureller Vielfalt, Traditionen und Identitäten",
      "Unterstützung lokaler Kulturen im Globalisierungsprozess",
    ],
  },
  politisch: {
    label: "Politische Nachhaltigkeit",
    icon: Leaf,
    subpoints: [
      "Demokratische Strukturen, Rechtsstaatlichkeit, Mitbestimmung",
      "Firmensitz und Produktionsstandorte",
    ],
  },
  technologisch: {
    label: "Technologische Nachhaltigkeit",
    icon: Recycle,
    subpoints: [
      "Förderung und Nutzung umweltfreundlicher und effizienter Technologien",
      "Innovation im Einklang mit Umwelt und Gesellschaft",
    ],
  },
  institutionell: {
    label: "Institutionelle Nachhaltigkeit",
    icon: Star,
    subpoints: [
      "Unterstützung von Institutionen, die nachhaltig wirken",
      "Integration von Nachhaltigkeit im Unternehmen",
    ],
  },
}

const products: Product[] = [
  {
    id: 1,
    name: "Organic Cotton T-Shirt",
    brand: "EcoWear",
    description: "100% organic cotton, ethically made in fair trade certified facilities",
    longDescription:
      "This premium organic cotton t-shirt is crafted from GOTS-certified organic cotton, ensuring no harmful chemicals were used in its production. Made in fair trade certified facilities that guarantee fair wages and safe working conditions for all workers. The production process is carbon neutral, and the packaging is 100% recyclable.",
    price: 29.99,
    category: "T-Shirts",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop"],
    attributes: [
      "produktqualitaet",
      "oekologisch",
      "sozial",
      "oekonomisch",
      "technologisch",
      "institutionell",
    ],
    rating: 4.8,
    reviews: 124,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["White", "Black", "Navy", "Forest Green"],
  },
  {
    id: 2,
    name: "Organic Linen Blouse",
    brand: "GreenStyle",
    description: "Breathable organic linen, perfect for summer",
    longDescription:
      "A beautiful organic linen blouse that combines style with sustainability. Made from GOTS-certified organic linen, this piece is perfect for warm weather while being gentle on the environment.",
    price: 59.99,
    category: "Tops",
    images: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop"],
    attributes: ["produktqualitaet", "oekologisch", "oekonomisch", "sozial", "technologisch"],
    rating: 4.6,
    reviews: 89,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["White", "Beige", "Light Blue"],
  },
  {
    id: 3,
    name: "Recycled Denim Jeans",
    brand: "ReThread",
    description: "Made from 80% recycled denim fibers",
    longDescription:
      "These stylish jeans are crafted from 80% recycled denim fibers, giving new life to discarded materials. Fair trade certified production ensures ethical manufacturing practices.",
    price: 89.0,
    category: "Pants",
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop"],
    attributes: ["produktqualitaet", "oekologisch", "technologisch", "oekonomisch"],
    rating: 4.9,
    reviews: 203,
    inStock: true,
    sizes: ["26", "28", "30", "32", "34", "36"],
    colors: ["Light Wash", "Medium Wash", "Dark Wash"],
  },
  {
    id: 4,
    name: "Hemp Hoodie",
    brand: "NatureFiber",
    description: "Cozy hemp blend hoodie, naturally durable",
    longDescription:
      "This cozy hoodie is made from a sustainable hemp and organic cotton blend. Hemp requires minimal water and no pesticides to grow, making it one of the most eco-friendly fibers available.",
    price: 75.0,
    category: "Outerwear",
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop"],
    attributes: ["oekologisch", "produktqualitaet", "sozial"],
    rating: 4.7,
    reviews: 156,
    inStock: true,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Natural", "Olive", "Charcoal"],
  },
  {
    id: 5,
    name: "Bamboo Fiber Dress",
    brand: "KindCraft",
    description: "Elegant bamboo fiber dress, silky smooth",
    longDescription:
      "An elegant dress made from sustainable bamboo fiber that feels silky smooth against your skin. Bamboo is naturally antibacterial and requires no pesticides to grow.",
    price: 95.99,
    category: "Dresses",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop"],
    attributes: ["sozial", "oekonomisch", "kulturell"],
    rating: 4.5,
    reviews: 78,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Navy", "Emerald"],
  },
  {
    id: 6,
    name: "Organic Cotton Shorts",
    brand: "EcoWear",
    description: "Comfortable organic cotton shorts",
    longDescription:
      "Perfect for casual days, these organic cotton shorts are made from GOTS-certified cotton. Produced in fair trade certified facilities with a carbon neutral process.",
    price: 42.99,
    category: "Pants",
    images: ["/beige-cotton-shorts-clothing.jpg"],
    attributes: ["produktqualitaet", "oekologisch"],
    rating: 4.4,
    reviews: 92,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Khaki", "Navy", "Black"],
  },
  {
    id: 7,
    name: "Recycled Wool Sweater",
    brand: "ReKnit",
    description: "Warm sweater from recycled wool fibers",
    longDescription:
      "Stay warm in this cozy sweater made from 100% recycled wool fibers. By using recycled materials, we reduce waste while creating beautiful, durable garments.",
    price: 85.99,
    category: "Tops",
    images: ["https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=300&h=300&fit=crop"],
    attributes: ["oekologisch", "technologisch", "institutionell", "produktqualitaet"],
    rating: 4.8,
    reviews: 167,
    inStock: true,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Cream", "Grey", "Forest Green"],
  },
  {
    id: 8,
    name: "Tencel Blazer",
    brand: "GreenStyle",
    description: "Professional blazer from sustainable Tencel",
    longDescription:
      "A sophisticated blazer made from Tencel, a fiber derived from sustainably harvested wood pulp. Perfect for the eco-conscious professional who doesn't compromise on style.",
    price: 145.0,
    category: "Outerwear",
    images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&h=300&fit=crop"],
    attributes: ["sozial", "oekonomisch", "kulturell"],
    rating: 4.6,
    reviews: 134,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Navy", "Charcoal"],
  },
  {
    id: 9,
    name: "Organic Silk Scarf",
    brand: "KindCraft",
    description: "Luxurious organic silk, handcrafted with care",
    longDescription:
      "A beautiful organic silk scarf that adds elegance to any outfit. Made from peace silk, which allows silkworms to complete their natural lifecycle.",
    price: 65.0,
    category: "Tops",
    images: ["https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=300&h=300&fit=crop"],
    attributes: ["kulturell", "sozial"],
    rating: 4.7,
    reviews: 89,
    inStock: true,
    sizes: ["One Size"],
    colors: ["Ivory", "Blush", "Sage"],
  },
  {
    id: 10,
    name: "Recycled Polyester Jacket",
    brand: "ReThread",
    description: "Waterproof jacket from recycled ocean plastic",
    longDescription:
      "This durable jacket is made from recycled ocean plastic, helping to clean our oceans while providing excellent weather protection.",
    price: 129.99,
    category: "Outerwear",
    images: ["https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300&h=300&fit=crop"],
    attributes: ["oekologisch", "technologisch", "politisch"],
    rating: 4.9,
    reviews: 245,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Navy", "Olive"],
  },
  {
    id: 11,
    name: "Bamboo Basic Tee",
    brand: "NatureFiber",
    description: "Soft bamboo fabric, naturally breathable",
    longDescription:
      "An everyday essential made from bamboo viscose. Naturally temperature-regulating and antimicrobial for all-day comfort.",
    price: 34.99,
    category: "T-Shirts",
    images: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=300&h=300&fit=crop"],
    attributes: ["produktqualitaet", "oekonomisch"],
    rating: 4.6,
    reviews: 178,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["White", "Grey", "Black", "Navy"],
  },
  {
    id: 12,
    name: "Hemp Cargo Pants",
    brand: "EcoWear",
    description: "Durable hemp cargo pants, built to last",
    longDescription:
      "Rugged cargo pants made from sustainable hemp. Perfect for outdoor adventures while being gentle on the planet.",
    price: 98.0,
    category: "Pants",
    images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=300&fit=crop"],
    attributes: ["oekologisch", "politisch", "institutionell"],
    rating: 4.5,
    reviews: 112,
    inStock: true,
    sizes: ["28", "30", "32", "34", "36", "38"],
    colors: ["Khaki", "Olive", "Black"],
  },
  {
    id: 13,
    name: "Organic Wrap Dress",
    brand: "GreenStyle",
    description: "Timeless wrap dress in organic cotton",
    longDescription:
      "A versatile wrap dress that flatters every figure. Made from soft organic cotton with natural dyes.",
    price: 89.99,
    category: "Dresses",
    images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=300&fit=crop"],
    attributes: ["produktqualitaet", "sozial", "kulturell", "oekonomisch"],
    rating: 4.8,
    reviews: 156,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Terracotta", "Navy", "Forest Green"],
  },
  {
    id: 14,
    name: "Recycled Cashmere Cardigan",
    brand: "ReKnit",
    description: "Luxuriously soft recycled cashmere",
    longDescription:
      "Indulge in the softness of cashmere without the environmental impact. Made from 100% recycled cashmere fibers.",
    price: 175.0,
    category: "Tops",
    images: ["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop"],
    attributes: ["technologisch", "institutionell"],
    rating: 4.9,
    reviews: 98,
    inStock: true,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Camel", "Grey", "Black"],
  },
  {
    id: 15,
    name: "Linen Summer Pants",
    brand: "KindCraft",
    description: "Lightweight linen for warm days",
    longDescription:
      "Stay cool and stylish in these relaxed-fit linen pants. Made from European flax with minimal water usage.",
    price: 79.0,
    category: "Pants",
    images: ["https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=300&h=300&fit=crop"],
    attributes: ["oekologisch", "kulturell", "politisch", "sozial"],
    rating: 4.4,
    reviews: 134,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["White", "Beige", "Light Blue"],
  },
  {
    id: 16,
    name: "Organic V-Neck Tee",
    brand: "NatureFiber",
    description: "Classic v-neck in organic cotton",
    longDescription:
      "A wardrobe staple made from 100% GOTS-certified organic cotton. Comfortable, breathable, and sustainably made.",
    price: 32.0,
    category: "T-Shirts",
    images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop"],
    attributes: ["produktqualitaet", "oekonomisch", "institutionell"],
    rating: 4.7,
    reviews: 201,
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["White", "Black", "Grey", "Navy"],
  },
]

const categories = [
  "All",
  "T-Shirts",
  "Tops",
  "Blouses",
  "Sweaters",
  "Hoodies",
  "Pants",
  "Jeans",
  "Shorts",
  "Skirts",
  "Dresses",
  "Jackets",
  "Coats",
  "Outerwear",
  "Activewear",
  "Underwear",
  "Swimwear",
  "Accessories",
]

const colorOptions = [
  { name: "Weiß", color: "#FFFFFF" },
  { name: "Schwarz", color: "#000000" },
  { name: "Grau", color: "#6B7280" },
  { name: "Navy", color: "#1E3A5F" },
  { name: "Beige", color: "#D4C4A8" },
  { name: "Olive", color: "#556B2F" },
  { name: "Terracotta", color: "#C4724B" },
  { name: "Blau", color: "#3B82F6" },
  { name: "Grün", color: "#22C55E" },
]

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "26", "28", "30", "32", "34", "36", "38"]

const producerOptions = [
  "EcoWear",
  "GreenStyle",
  "ReThread",
  "NatureFiber",
  "KindCraft",
  "ReKnit",
  "FairFashion",
  "OrganicBasics",
  "Patagonia",
  "Veja",
]

const materialOptions = [
  "100% Bio-Baumwolle",
  "Bio-Leinen",
  "Recyceltes Polyester",
  "Hanf",
  "Bambusfaser",
  "Tencel/Lyocell",
  "Recycelte Wolle",
  "Bio-Seide",
  "Recyceltes Kaschmir",
  "Kork",
]

const importanceScale = [
  { value: "1", label: "Unwichtig" },
  { value: "2", label: "Etwas wichtig" },
  { value: "3", label: "Wichtig" },
  { value: "4", label: "Sehr wichtig" },
]

export default function SustainableShop() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const [sustainabilityImportance, setSustainabilityImportance] = useState<Record<string, string>>({
    produktqualitaet: "4",
    oekologisch: "4",
    oekonomisch: "3",
    sozial: "3",
    kulturell: "2",
    politisch: "2",
    technologisch: "3",
    institutionell: "2",
  })

  const [sortBy, setSortBy] = useState("relevance")
  const [expandedSections, setExpandedSections] = useState({
    sustainability: false,
    categories: true,
  })
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({})

  const [expandedFilterSections, setExpandedFilterSections] = useState({
    price: true,
    colors: true,
    sizes: true,
    producers: false,
    materials: false,
  })
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200 })
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedProducers, setSelectedProducers] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])

  const handleImportanceChange = (attribute: string, importance: string) => {
    setSustainabilityImportance((prev) => ({
      ...prev,
      [attribute]: importance,
    }))
  }

  const toggleSection = (key: "sustainability" | "categories") => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleFilterExpansion = (key: string) => {
    setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleFilterSection = (key: keyof typeof expandedFilterSections) => {
    setExpandedFilterSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (selectedCategory !== "All" && product.category !== selectedCategory) {
          return false
        }
        if (priceRange.min > product.price || priceRange.max < product.price) {
          return false
        }
        if (
          selectedColors.length > 0 &&
          !selectedColors.some((color) => product.colors.includes(color))
        ) {
          return false
        }
        if (
          selectedSizes.length > 0 &&
          !selectedSizes.some((size) => product.sizes.includes(size))
        ) {
          return false
        }
        if (selectedProducers.length > 0 && !selectedProducers.includes(product.brand)) {
          return false
        }
        if (
          selectedMaterials.length > 0 &&
          !selectedMaterials.some((material) => product.longDescription.includes(material))
        ) {
          return false
        }
        return true
      })
      .map((product) => {
        let matchScore = 0
        let totalPossibleScore = 0

        Object.entries(sustainabilityImportance).forEach(([attribute, importance]) => {
          const importanceValue = Number.parseInt(importance)
          totalPossibleScore += importanceValue

          if (product.attributes.includes(attribute)) {
            matchScore += importanceValue
          }
        })

        const baseMatchPercentage =
          totalPossibleScore > 0 ? (matchScore / totalPossibleScore) * 100 : 0
        // Add a pseudo-random offset based on product ID for consistent variation
        const randomOffset = ((product.id * 7) % 8) - 4 // Range: -4 to +3
        const matchPercentage = Math.min(100, Math.max(0, baseMatchPercentage + 30 + randomOffset))

        return {
          ...product,
          matchScore,
          matchPercentage,
        }
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "relevance":
            if (b.matchScore !== a.matchScore) {
              return b.matchScore - a.matchScore
            }
            return b.rating - a.rating
          case "price-low":
            return a.price - b.price
          case "price-high":
            return b.price - a.price
          case "rating":
            return b.rating - a.rating
          case "newest":
            return b.id - a.id
          default:
            return b.matchScore - a.matchScore
        }
      })
  }, [
    selectedCategory,
    sustainabilityImportance,
    sortBy,
    priceRange,
    selectedColors,
    selectedSizes,
    selectedProducers,
    selectedMaterials,
  ])

  const getAttributeIcon = (attribute: string) => {
    const filter = sustainabilityFilters[attribute as keyof typeof sustainabilityFilters]
    if (filter) {
      const Icon = filter.icon
      return <Icon className="h-3 w-3" />
    }
    return null
  }

  const getAttributeLabel = (attribute: string) => {
    return (
      sustainabilityFilters[attribute as keyof typeof sustainabilityFilters]?.label || attribute
    )
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "bg-teal-100 text-teal-800 border-teal-300"
    if (percentage >= 60) return "bg-slate-100 text-slate-800 border-slate-300"
    if (percentage >= 40) return "bg-orange-100 text-orange-800 border-orange-300"
    return "bg-gray-100 text-gray-800 border-gray-300"
  }

  const getImportanceLabel = (value: string) => {
    return importanceScale.find((scale) => scale.value === value)?.label || ""
  }

  const handleProductClick = (productId: number) => {
    window.location.href = `/product?id=${productId}`
  }

  const handleBrandClick = (e: React.MouseEvent, brand: string) => {
    e.stopPropagation()
    const brandSlug = brand.toLowerCase().replace(/\s+/g, "-")
    window.location.href = `/producer?id=${brandSlug}`
  }

  return (
    <div>
      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        {/* Filters Sidebar */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-100 p-4">
            <h2 className="text-lg font-semibold text-slate-800">Filter</h2>
          </div>

          {/* Nachhaltigkeitspräferenzen Section */}
          <div className="border-b border-slate-200">
            <button
              onClick={() => toggleSection("sustainability")}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">Nachhaltigkeitspräferenzen</span>
              {expandedSections.sustainability ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>
            {expandedSections.sustainability && (
              <div className="space-y-4 px-4 pb-4">
                <p className="text-sm text-slate-500">
                  Bewerten Sie, wie wichtig Ihnen jeder Nachhaltigkeitsaspekt ist.
                </p>
                {Object.entries(sustainabilityFilters).map(([key, filter]) => {
                  const Icon = filter.icon
                  return (
                    <div key={key} className="space-y-2">
                      <button
                        onClick={() => toggleFilterExpansion(key)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-teal-600" />
                          <span className="text-sm font-medium text-slate-700">{filter.label}</span>
                        </div>
                        {expandedFilters[key] ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </button>

                      {expandedFilters[key] && (
                        <div className="ml-6 rounded bg-slate-50 p-2 text-xs text-slate-600">
                          <ul className="list-inside list-disc space-y-1">
                            {filter.subpoints.map((subpoint, idx) => (
                              <li key={idx}>{subpoint}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="ml-6 flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="4"
                          value={sustainabilityImportance[key]}
                          onChange={(e) => handleImportanceChange(key, e.target.value)}
                          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
                        />
                        <span className="w-24 text-right text-xs text-slate-500">
                          {getImportanceLabel(sustainabilityImportance[key])}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Kategorien Section */}
          <div>
            <button
              onClick={() => toggleSection("categories")}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">Kategorien</span>
              {expandedSections.categories ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>
            {expandedSections.categories && (
              <div className="px-4 pb-4">
                <div className="flex flex-col gap-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        selectedCategory === category
                          ? "bg-teal-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Range Section */}
          <div className="border-t border-slate-200">
            <button
              onClick={() => toggleFilterSection("price")}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">Preisspanne</span>
              {expandedFilterSections.price ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>
            {expandedFilterSections.price && (
              <div className="space-y-4 px-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-slate-500">Min (€)</label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange((prev) => ({ ...prev, min: Number(e.target.value) }))
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <span className="mt-5 text-slate-400">–</span>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-slate-500">Max (€)</label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      placeholder="200"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
                />
              </div>
            )}
          </div>

          {/* Colors Section */}
          <div className="border-t border-slate-200">
            <button
              onClick={() => toggleFilterSection("colors")}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">Farben</span>
              {expandedFilterSections.colors ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>
            {expandedFilterSections.colors && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() =>
                        setSelectedColors((prev) =>
                          prev.includes(color.name)
                            ? prev.filter((c) => c !== color.name)
                            : [...prev, color.name]
                        )
                      }
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        selectedColors.includes(color.name)
                          ? "border-teal-600 ring-2 ring-teal-200"
                          : "border-slate-300"
                      }`}
                      style={{ backgroundColor: color.color }}
                      title={color.name}
                    />
                  ))}
                </div>
                {selectedColors.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">{selectedColors.join(", ")}</p>
                )}
              </div>
            )}
          </div>

          {/* Sizes Section */}
          <div className="border-t border-slate-200">
            <button
              onClick={() => toggleFilterSection("sizes")}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">Größen</span>
              {expandedFilterSections.sizes ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>
            {expandedFilterSections.sizes && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setSelectedSizes((prev) =>
                          prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
                        )
                      }
                      className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                        selectedSizes.includes(size)
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Producers Section */}
          <div className="border-t border-slate-200">
            <button
              onClick={() => toggleFilterSection("producers")}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">Hersteller</span>
              {expandedFilterSections.producers ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>
            {expandedFilterSections.producers && (
              <div className="px-4 pb-4">
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                  {producerOptions.map((producer) => (
                    <label key={producer} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedProducers.includes(producer)}
                        onChange={() =>
                          setSelectedProducers((prev) =>
                            prev.includes(producer)
                              ? prev.filter((p) => p !== producer)
                              : [...prev, producer]
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-slate-600">{producer}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Materials Section */}
          <div className="border-t border-slate-200">
            <button
              onClick={() => toggleFilterSection("materials")}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="font-medium text-slate-700">Materialien</span>
              {expandedFilterSections.materials ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>
            {expandedFilterSections.materials && (
              <div className="px-4 pb-4">
                <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                  {materialOptions.map((material) => (
                    <label key={material} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(material)}
                        onChange={() =>
                          setSelectedMaterials((prev) =>
                            prev.includes(material)
                              ? prev.filter((m) => m !== material)
                              : [...prev, material]
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-slate-600">{material}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="space-y-6">
          {/* Products Header */}
          <div className="flex items-center justify-between">
            <p className="text-slate-600">
              <span className="font-medium">{filteredProducts.length}</span> Produkte gefunden
            </p>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 transition-colors hover:bg-slate-50"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="text-sm">Sortieren</span>
              </button>
              {isSortDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                  {[
                    { value: "relevance", label: "Relevanz" },
                    { value: "price-low", label: "Preis: Niedrig → Hoch" },
                    { value: "price-high", label: "Preis: Hoch → Niedrig" },
                    { value: "rating", label: "Bewertung" },
                    { value: "newest", label: "Neueste" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setIsSortDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                        sortBy === option.value ? "bg-slate-100 font-medium" : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <span
                    className={`absolute right-2 top-2 rounded-full border px-2 py-1 text-xs ${getMatchColor(product.matchPercentage)}`}
                  >
                    {Math.round(product.matchPercentage)}% Match
                  </span>
                  <img
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <button
                    onClick={(e) => handleBrandClick(e, product.brand)}
                    className="text-xs font-medium uppercase tracking-wide text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {product.brand}
                  </button>
                  <h3 className="line-clamp-1 font-medium text-slate-800">{product.name}</h3>
                  <p className="line-clamp-2 text-sm text-slate-500">{product.description}</p>

                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm text-slate-600">{product.rating}</span>
                    <span className="text-xs text-slate-400">({product.reviews})</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-bold text-slate-800">€{product.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-6">
            <button className="cursor-not-allowed rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-400">
              Vorherige
            </button>
            <button className="rounded-lg border border-teal-600 bg-teal-600 px-4 py-2 text-white">
              1
            </button>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50">
              2
            </button>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50">
              3
            </button>
            <span className="px-2 text-slate-400">...</span>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50">
              89
            </button>
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50">
              Nächste
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
