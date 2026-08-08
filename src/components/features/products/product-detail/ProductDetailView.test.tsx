/**
 * Guards the *pass-through* of the seller slug, not the link building itself
 * (that is covered by seller-url.test.ts). Dropping `sellerSlug` from the
 * <SellerCard> call site would otherwise restore the exact asymmetry this
 * wiring removed: the seller name linking to ?slug= while the card directly
 * below it still goes to ?id= — two routes to the same producer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ProductDetail } from "@/src/types"
import { ProductDetailView, type ProductDetailViewProps } from "./ProductDetailView"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
}))

// Heavy children are irrelevant here — keep the render narrow.
vi.mock("./ProductGallery", () => ({ ProductGallery: () => null }))
vi.mock("./ProductTabs", () => ({ ProductTabs: () => null }))
vi.mock("./VariantSelector", () => ({ VariantSelector: () => null }))
vi.mock("./AddToCartButton", () => ({ AddToCartButton: () => null }))
vi.mock("./ShippingInfo", () => ({ ShippingInfo: () => null }))
vi.mock("./PriceWithStock", () => ({ PriceWithStock: () => null }))
vi.mock("./QuantityStepper", () => ({ QuantityStepper: () => null }))

function renderView(seller: ProductDetail["seller"]) {
  const props: ProductDetailViewProps = {
    product: { id: "p1", slug: "eco-shirt", name: "Eco Shirt", seller },
    certificates: [],
    selectedVariant: null,
    onSelectVariant: vi.fn(),
    quantity: 1,
    onQuantityChange: vi.fn(),
    onAddToCart: vi.fn(),
    isAdding: false,
    justAdded: false,
    inStock: true,
    images: [],
    price: 29.9,
    sellerName: "Alpha Manufaktur",
  }
  render(<ProductDetailView {...props} />)
}

describe("ProductDetailView — producer link wiring (Elysion-UG/elysion-marketplace-backend#104)", () => {
  beforeEach(() => vi.clearAllMocks())

  const nameButton = () => screen.getByRole("button", { name: "Alpha Manufaktur" })
  const sellerCard = () => screen.getByRole("button", { name: /Verifizierter Verkäufer/ })

  it("passes the slug to both link targets — name and card agree on ?slug=", async () => {
    renderView({ userId: "s1", slug: "alpha-manufaktur", companyName: "Alpha Manufaktur" })

    await userEvent.click(nameButton())
    expect(mockPush).toHaveBeenLastCalledWith("/producer?slug=alpha-manufaktur")

    await userEvent.click(sellerCard())
    expect(mockPush).toHaveBeenLastCalledWith("/producer?slug=alpha-manufaktur")

    expect(mockPush).toHaveBeenCalledTimes(2)
  })

  it("keeps name and card in agreement on ?id= for a non-APPROVED seller", async () => {
    renderView({ userId: "s1", slug: null, companyName: "Alpha Manufaktur" })

    await userEvent.click(nameButton())
    expect(mockPush).toHaveBeenLastCalledWith("/producer?id=s1")

    await userEvent.click(sellerCard())
    expect(mockPush).toHaveBeenLastCalledWith("/producer?id=s1")
  })
})
