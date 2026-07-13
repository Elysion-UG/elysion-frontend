import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ProductDetail } from "@/src/types"

// Next.js Image renders a plain <img> in jsdom; stub to avoid loader config.
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

import ProductCard from "./ProductCard"

function baseProduct(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "p1",
    name: "Bio-Baumwoll T-Shirt",
    slug: "bio-baumwoll-t-shirt",
    price: 29.9,
    ...overrides,
  } as ProductDetail
}

const HREF = "/product?slug=bio-baumwoll-t-shirt"

describe("ProductCard — availability", () => {
  it("shows 'Auf Lager' when the product is in stock", () => {
    render(<ProductCard product={baseProduct({ inStock: true })} productHref={HREF} />)
    expect(screen.getByText("Auf Lager")).toBeInTheDocument()
    expect(screen.queryByText("Ausverkauft")).not.toBeInTheDocument()
  })

  it("shows 'Ausverkauft' when the product is out of stock", () => {
    render(<ProductCard product={baseProduct({ inStock: false })} productHref={HREF} />)
    // Image overlay + price-row label both read "Ausverkauft".
    expect(screen.getAllByText("Ausverkauft").length).toBeGreaterThan(0)
    expect(screen.queryByText("Auf Lager")).not.toBeInTheDocument()
  })

  it("treats unknown availability as in stock (no false 'sold out')", () => {
    render(<ProductCard product={baseProduct()} productHref={HREF} />)
    expect(screen.getByText("Auf Lager")).toBeInTheDocument()
  })
})

describe("ProductCard — links", () => {
  it("renders the whole card as a link to the product with an accessible name", () => {
    render(<ProductCard product={baseProduct()} productHref={HREF} />)
    const cardLink = screen.getByRole("link", { name: "Bio-Baumwoll T-Shirt" })
    expect(cardLink).toHaveAttribute("href", HREF)
  })

  it("renders the seller as its own link when a sellerHref is given", () => {
    render(
      <ProductCard
        product={baseProduct({ seller: { userId: "s1", companyName: "GreenThread" } })}
        productHref={HREF}
        sellerHref="/producer?id=s1"
      />
    )
    const sellerLink = screen.getByRole("link", { name: "GreenThread" })
    expect(sellerLink).toHaveAttribute("href", "/producer?id=s1")
  })

  it("renders the seller as plain text (no link) when sellerHref is null", () => {
    render(
      <ProductCard
        product={baseProduct({ seller: { userId: "s1", companyName: "GreenThread" } })}
        productHref={HREF}
        sellerHref={null}
      />
    )
    expect(screen.getByText("GreenThread")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "GreenThread" })).not.toBeInTheDocument()
  })
})
