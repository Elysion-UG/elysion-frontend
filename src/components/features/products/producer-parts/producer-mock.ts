export interface Producer {
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

export interface ProducerProduct {
  id: number
  name: string
  price: number
  image: string
  rating: number
  reviews: number
  category: string
}

export interface SustainabilityBreakdownItem {
  label: string
  score: number
}

export const SUSTAINABILITY_LABELS: Record<string, string> = {
  produktqualitaet: "Produktqualität",
  oekologische: "Ökologische Nachhaltigkeit",
  oekonomische: "Ökonomische Nachhaltigkeit",
  soziale: "Soziale Nachhaltigkeit",
  kulturelle: "Kulturelle Nachhaltigkeit",
  politische: "Politische Nachhaltigkeit",
  technologische: "Technologische Nachhaltigkeit",
  institutionelle: "Institutionelle Nachhaltigkeit",
}

export function getSustainabilityLabel(attribute: string): string {
  return SUSTAINABILITY_LABELS[attribute] ?? attribute
}

// Until `GET /api/v1/producers/{id}` exists in the backend, the producer page
// renders mock data. See docs/api-integration.md and the open-frontend-items memo.
export const MOCK_PRODUCER: Producer = {
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

export const MOCK_PRODUCER_PRODUCTS: ProducerProduct[] = [
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

export const MOCK_SUSTAINABILITY_BREAKDOWN: SustainabilityBreakdownItem[] = [
  { label: "Umweltauswirkung", score: 95 },
  { label: "Ethische Arbeitspraktiken", score: 92 },
  { label: "Lieferketten-Transparenz", score: 88 },
  { label: "Materialbeschaffung", score: 94 },
  { label: "Verpackung & Abfall", score: 90 },
]
