import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { CartSkeleton } from "./CartSkeleton"

describe("CartSkeleton", () => {
  it("renders a skeleton with aria-busy for screen readers", () => {
    render(<CartSkeleton />)
    const skeleton = screen.getByTestId("cart-skeleton")
    expect(skeleton).toHaveAttribute("aria-busy", "true")
  })

  it("renders multiple item placeholders", () => {
    const { container } = render(<CartSkeleton />)
    const pulsing = container.querySelectorAll(".animate-pulse")
    expect(pulsing.length).toBeGreaterThan(5)
  })
})
