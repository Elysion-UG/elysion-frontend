import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ProductDetail } from "@/src/types"

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUseSellerProducts = vi.fn()
const mockPush = vi.fn()
const mockGet = vi.fn()

vi.mock("@/src/hooks/useSellerProducts", () => ({
  useSellerProducts: (sellerId: string | null) => mockUseSellerProducts(sellerId),
}))

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

describe("ProducerPage — real seller data", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockReturnValue("s1")
  })

  it("renders the seller company name, product count and real products", () => {
    mockUseSellerProducts.mockReturnValue({
      data: { products: PRODUCTS, companyName: "GreenThread", totalElements: 2 },
      isLoading: false,
      error: null,
    })

    render(<ProducerPage />)

    expect(mockUseSellerProducts).toHaveBeenCalledWith("s1")
    expect(screen.getByRole("heading", { name: "GreenThread" })).toBeInTheDocument()
    expect(screen.getByText("2 Produkte")).toBeInTheDocument()
    expect(screen.getByText("Bio-Baumwoll T-Shirt")).toBeInTheDocument()
    expect(screen.getByText("Leinen Sommerkleid")).toBeInTheDocument()
  })

  it("links to the product detail by slug", () => {
    mockUseSellerProducts.mockReturnValue({
      data: { products: PRODUCTS, companyName: "GreenThread", totalElements: 2 },
      isLoading: false,
      error: null,
    })

    render(<ProducerPage />)

    expect(screen.getByRole("link", { name: "Bio-Baumwoll T-Shirt" })).toHaveAttribute(
      "href",
      "/product?slug=bio-baumwoll-t-shirt"
    )
  })

  it("shows an empty state when the seller has no products", () => {
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
    mockUseSellerProducts.mockReturnValue({ data: undefined, isLoading: true, error: null })

    render(<ProducerPage />)

    expect(screen.queryByText(/Produkte?$/)).not.toBeInTheDocument()
    expect(screen.queryByText("Bio-Baumwoll T-Shirt")).not.toBeInTheDocument()
  })

  it("shows only the 'not found' state without a placeholder header when no seller id is provided", () => {
    mockGet.mockReturnValue(null)
    mockUseSellerProducts.mockReturnValue({ data: undefined, isLoading: false, error: null })

    render(<ProducerPage />)

    expect(screen.getByText("Verkäufer nicht gefunden")).toBeInTheDocument()
    // No fabricated placeholder header card ("Verkäufer" heading / "0 Produkte").
    expect(screen.queryByRole("heading", { name: "Verkäufer" })).not.toBeInTheDocument()
    expect(screen.queryByText(/Produkte?$/)).not.toBeInTheDocument()
  })

  it("shows only the error state without a placeholder header when loading fails", () => {
    mockGet.mockReturnValue("s1")
    mockUseSellerProducts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("boom"),
    })

    render(<ProducerPage />)

    expect(screen.getByText("Produkte konnten nicht geladen werden")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Verkäufer" })).not.toBeInTheDocument()
    expect(screen.queryByText(/Produkte?$/)).not.toBeInTheDocument()
  })
})
