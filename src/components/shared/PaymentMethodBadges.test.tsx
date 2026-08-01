import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PaymentMethodBadges } from "./PaymentMethodBadges"

describe("PaymentMethodBadges", () => {
  it("renders all launch payment methods", () => {
    render(<PaymentMethodBadges />)
    for (const label of ["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay", "Klarna"]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it("does not communicate SEPA (fast-follow, §1.3)", () => {
    render(<PaymentMethodBadges />)
    expect(screen.queryByText(/SEPA/i)).not.toBeInTheDocument()
  })

  it("exposes an accessible group label", () => {
    render(<PaymentMethodBadges />)
    expect(screen.getByLabelText("Akzeptierte Zahlungsarten")).toBeInTheDocument()
  })

  it("applies the dark tone styling on request", () => {
    const { container } = render(<PaymentMethodBadges tone="dark" />)
    expect(container.querySelector("li")?.className).toContain("text-sand-page/80")
  })
})
