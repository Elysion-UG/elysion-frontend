import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import VersandPage from "./page"

/**
 * The /versand route exists specifically so the § 1 PAngV price notice on
 * product pages ("zzgl. Versandkosten") links somewhere real instead of a 404
 * (#155). These assertions lock the mandatory content in place.
 */
describe("/versand page (#155)", () => {
  it("states that prices include VAT", () => {
    render(<VersandPage />)
    expect(screen.getByText(/inklusive der gesetzlichen\s+Mehrwertsteuer/i)).toBeInTheDocument()
  })

  it("explains that shipping costs are shown transparently before checkout", () => {
    render(<VersandPage />)
    expect(screen.getByText(/Warenkorb und im/i)).toBeInTheDocument()
  })

  it("links to the Widerrufsbelehrung", () => {
    render(<VersandPage />)
    expect(screen.getByRole("link", { name: /Widerrufsbelehrung/i })).toHaveAttribute(
      "href",
      "/widerruf"
    )
  })
})
