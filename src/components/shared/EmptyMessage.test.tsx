import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { EmptyMessage } from "./EmptyMessage"

describe("EmptyMessage", () => {
  it("renders the provided message text", () => {
    render(<EmptyMessage message="Keine Bestellungen gefunden." />)

    expect(screen.getByText("Keine Bestellungen gefunden.")).toBeInTheDocument()
  })
})
