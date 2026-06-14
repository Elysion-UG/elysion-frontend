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

const noop = () => {}

describe("ProductCard — availability", () => {
  it("shows 'Auf Lager' when the product is in stock", () => {
    render(
      <ProductCard
        product={baseProduct({ inStock: true })}
        onProductClick={noop}
        onSellerClick={noop}
      />
    )
    expect(screen.getByText("Auf Lager")).toBeInTheDocument()
    expect(screen.queryByText("Ausverkauft")).not.toBeInTheDocument()
  })

  it("shows 'Ausverkauft' when the product is out of stock", () => {
    render(
      <ProductCard
        product={baseProduct({ inStock: false })}
        onProductClick={noop}
        onSellerClick={noop}
      />
    )
    // Image overlay + price-row label both read "Ausverkauft".
    expect(screen.getAllByText("Ausverkauft").length).toBeGreaterThan(0)
    expect(screen.queryByText("Auf Lager")).not.toBeInTheDocument()
  })

  it("treats unknown availability as in stock (no false 'sold out')", () => {
    render(<ProductCard product={baseProduct()} onProductClick={noop} onSellerClick={noop} />)
    expect(screen.getByText("Auf Lager")).toBeInTheDocument()
  })
})
