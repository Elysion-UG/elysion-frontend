import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ProductDetail, PublicSellerProfile } from "@/src/types"
import { ApiError } from "@/src/lib/api-client"

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUseSellerProducts = vi.fn()
const mockUsePublicSellerProfile = vi.fn()
const mockPush = vi.fn()
const mockGet = vi.fn()

vi.mock("@/src/hooks/useSellerProducts", () => ({
  useSellerProducts: (sellerId: string | null) => mockUseSellerProducts(sellerId),
}))

vi.mock("@/src/hooks/usePublicSellerProfile", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/hooks/usePublicSellerProfile")>()
  return {
    ...actual,
    usePublicSellerProfile: (slug: string | null) => mockUsePublicSellerProfile(slug),
  }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  useSearchParams: () => ({ get: mockGet }),
}))

// Stub ProductCard to isolate the page from image/currency rendering.
vi.mock("./ProductCard", () => ({
  default: ({ product, productHref }: { product: ProductDetail; productHref: string }) => (
    <a href={productHref}>{product.name}</a>
  ),
}))

import ProducerPage from "./ProducerPage"

const PRODUCTS: ProductDetail[] = [
  {
    id: "p1",
    name: "Bio-Baumwoll T-Shirt",
    slug: "bio-baumwoll-t-shirt",
    seller: { userId: "s1", companyName: "GreenThread" },
  } as ProductDetail,
  {
    id: "p2",
    name: "Leinen Sommerkleid",
    slug: "leinen-sommerkleid",
    seller: { userId: "s1", companyName: "GreenThread" },
  } as ProductDetail,
]

const PROFILE: PublicSellerProfile = {
  id: "s1",
  slug: "greenthread",
  companyName: "GreenThread",
  description: "Wir weben seit 1998 in Ostwestfalen.",
  location: "Bielefeld, DE",
  foundedYear: 1998,
  sustainabilityScore: 87,
  certifications: [
    {
      certificateId: "c1",
      certificateType: "ORGANIC",
      title: "EU Organic Certificate",
      issuerName: "Control Union",
      expiryDate: "2027-01-01",
      status: "VERIFIED",
    },
  ],
}

/** searchParams.get() — nur die tatsächlich gesetzten Parameter. */
function searchParams(params: { slug?: string; id?: string }) {
  mockGet.mockImplementation((key: string) => params[key as "slug" | "id"] ?? null)
}

function productsLoaded() {
  mockUseSellerProducts.mockReturnValue({
    data: { products: PRODUCTS, companyName: "GreenThread", totalElements: 2 },
    isLoading: false,
    error: null,
  })
}

function profileIdle() {
  mockUsePublicSellerProfile.mockReturnValue({ data: undefined, isLoading: false, error: null })
}

describe("ProducerPage — public seller profile (#104)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profileIdle()
    productsLoaded()
  })

  it("loads the profile by slug and the products by the id it returns", () => {
    searchParams({ slug: "greenthread" })
    mockUsePublicSellerProfile.mockReturnValue({
      data: PROFILE,
      isLoading: false,
      error: null,
    })

    render(<ProducerPage />)

    expect(mockUsePublicSellerProfile).toHaveBeenCalledWith("greenthread")
    expect(mockUseSellerProducts).toHaveBeenCalledWith("s1")
  })

  it("renders description, location, founded year, score and verified certificates", () => {
    searchParams({ slug: "greenthread" })
    mockUsePublicSellerProfile.mockReturnValue({ data: PROFILE, isLoading: false, error: null })

    render(<ProducerPage />)

    expect(screen.getByRole("heading", { name: "GreenThread" })).toBeInTheDocument()
    expect(screen.getByText("Wir weben seit 1998 in Ostwestfalen.")).toBeInTheDocument()
    expect(screen.getByText("Bielefeld, DE")).toBeInTheDocument()
    expect(screen.getByText("gegründet 1998")).toBeInTheDocument()
    expect(screen.getByText("87")).toBeInTheDocument()
    expect(screen.getByText("Verifizierte Zertifikate")).toBeInTheDocument()
    expect(screen.getByText("EU Organic Certificate")).toBeInTheDocument()
    expect(screen.getByText(/Control Union/)).toBeInTheDocument()
  })

  it("waits for the profile id before loading products", () => {
    searchParams({ slug: "greenthread" })
    mockUsePublicSellerProfile.mockReturnValue({ data: undefined, isLoading: true, error: null })

    render(<ProducerPage />)

    expect(mockUseSellerProducts).toHaveBeenCalledWith(null)
  })

  it("treats a 404 as 'not found' — unknown slug and unapproved seller look the same", () => {
    searchParams({ slug: "ghost" })
    mockUsePublicSellerProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(404, "Seller profile not found"),
    })

    render(<ProducerPage />)

    expect(screen.getByText("Verkäufer nicht gefunden")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "GreenThread" })).not.toBeInTheDocument()
  })

  it("shows the error state for a non-404 profile failure", () => {
    searchParams({ slug: "greenthread" })
    mockUsePublicSellerProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiError(500, "boom"),
    })

    render(<ProducerPage />)

    expect(screen.getByText("Produzent konnte nicht geladen werden")).toBeInTheDocument()
  })
})

describe("ProducerPage — ?id= fallback for existing links", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profileIdle()
    productsLoaded()
  })

  it("keeps working without a slug and does not query the profile endpoint", () => {
    searchParams({ id: "s1" })

    render(<ProducerPage />)

    expect(mockUsePublicSellerProfile).toHaveBeenCalledWith(null)
    expect(mockUseSellerProducts).toHaveBeenCalledWith("s1")
    expect(screen.getByRole("heading", { name: "GreenThread" })).toBeInTheDocument()
    expect(screen.getByText("2 Produkte")).toBeInTheDocument()
  })

  it("links to the product detail by slug", () => {
    searchParams({ id: "s1" })

    render(<ProducerPage />)

    expect(screen.getByRole("link", { name: "Bio-Baumwoll T-Shirt" })).toHaveAttribute(
      "href",
      "/product?slug=bio-baumwoll-t-shirt"
    )
  })

  it("shows an empty state when the seller has no products", () => {
    searchParams({ id: "s1" })
    mockUseSellerProducts.mockReturnValue({
      data: { products: [], companyName: null, totalElements: 0 },
      isLoading: false,
      error: null,
    })

    render(<ProducerPage />)

    expect(screen.getByText("Keine Produkte")).toBeInTheDocument()
    expect(screen.queryByText("Bio-Baumwoll T-Shirt")).not.toBeInTheDocument()
  })

  it("does not render the product count while loading", () => {
    searchParams({ id: "s1" })
    mockUseSellerProducts.mockReturnValue({ data: undefined, isLoading: true, error: null })

    render(<ProducerPage />)

    expect(screen.queryByText(/Produkte?$/)).not.toBeInTheDocument()
    expect(screen.queryByText("Bio-Baumwoll T-Shirt")).not.toBeInTheDocument()
  })

  it("shows only the 'not found' state without a placeholder header when neither slug nor id is given", () => {
    searchParams({})
    mockUseSellerProducts.mockReturnValue({ data: undefined, isLoading: false, error: null })

    render(<ProducerPage />)

    expect(screen.getByText("Verkäufer nicht gefunden")).toBeInTheDocument()
    // No fabricated placeholder header card ("Verkäufer" heading / "0 Produkte").
    expect(screen.queryByRole("heading", { name: "Verkäufer" })).not.toBeInTheDocument()
    expect(screen.queryByText(/Produkte?$/)).not.toBeInTheDocument()
  })

  // Ohne Profil trägt die Seite bei einem Listenfehler nichts Echtes — hier ist
  // der Vollbild-Fehler richtig. Und er muss von den Produkten sprechen: auf
  // diesem Pfad wurde nie ein Produzent geladen.
  it("shows only the error state without a placeholder header when the product load fails", () => {
    searchParams({ id: "s1" })
    mockUseSellerProducts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("boom"),
    })

    render(<ProducerPage />)

    expect(screen.getByText("Produkte konnten nicht geladen werden")).toBeInTheDocument()
    expect(screen.queryByText("Produzent konnte nicht geladen werden")).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Verkäufer" })).not.toBeInTheDocument()
    expect(screen.queryByText(/Produkte?$/)).not.toBeInTheDocument()
  })
})

describe("ProducerPage — die beiden Fehlerquellen bleiben getrennt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profileIdle()
    productsLoaded()
  })

  it("keeps the loaded profile when only the product list fails", () => {
    searchParams({ slug: "greenthread" })
    mockUsePublicSellerProfile.mockReturnValue({ data: PROFILE, isLoading: false, error: null })
    mockUseSellerProducts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("boom"),
    })

    render(<ProducerPage />)

    // Profil steht weiterhin …
    expect(screen.getByRole("heading", { name: "GreenThread" })).toBeInTheDocument()
    expect(screen.getByText("Wir weben seit 1998 in Ostwestfalen.")).toBeInTheDocument()
    // … der Ausfall wird nur im Inhaltsbereich gemeldet …
    expect(screen.getByText("Produkte konnten nicht geladen werden")).toBeInTheDocument()
    expect(screen.queryByText("Produzent konnte nicht geladen werden")).not.toBeInTheDocument()
    // … und die Produktzahl wird nicht als "0 Produkte" erfunden.
    expect(screen.queryByText(/^0 Produkte$/)).not.toBeInTheDocument()
  })

  it("renders the certificate expiry without a timezone shift", () => {
    searchParams({ slug: "greenthread" })
    mockUsePublicSellerProfile.mockReturnValue({ data: PROFILE, isLoading: false, error: null })

    render(<ProducerPage />)

    // `new Date("2027-01-01")` wäre UTC-Mitternacht und zeigte westlich von
    // Greenwich den 31.12.2026.
    expect(screen.getByText(/gültig bis 01\.01\.2027/)).toBeInTheDocument()
  })
})
