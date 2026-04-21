import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { OrderDetailSkeleton } from "./OrderDetailSkeleton"

describe("OrderDetailSkeleton", () => {
  it("renders with aria-busy", () => {
    render(<OrderDetailSkeleton />)
    expect(screen.getByTestId("order-detail-skeleton")).toHaveAttribute("aria-busy", "true")
  })

  it("renders enough placeholder blocks to approximate the real layout", () => {
    const { container } = render(<OrderDetailSkeleton />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(8)
  })
})
