import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { CheckoutSkeleton } from "./CheckoutSkeleton"

describe("CheckoutSkeleton", () => {
  it("renders with aria-busy", () => {
    render(<CheckoutSkeleton />)
    expect(screen.getByTestId("checkout-skeleton")).toHaveAttribute("aria-busy", "true")
  })

  it("renders address card placeholders", () => {
    const { container } = render(<CheckoutSkeleton />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(5)
  })
})
