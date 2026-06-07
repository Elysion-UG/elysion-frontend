import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PageHeader } from "./PageHeader"

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="Benutzerverwaltung" />)

    expect(screen.getByRole("heading", { name: "Benutzerverwaltung" })).toBeInTheDocument()
  })

  it("renders the subtitle when provided", () => {
    render(<PageHeader title="Benutzerverwaltung" subtitle="42 Benutzer insgesamt" />)

    expect(screen.getByText("42 Benutzer insgesamt")).toBeInTheDocument()
  })

  it("does not render a subtitle element when subtitle is omitted", () => {
    const { container } = render(<PageHeader title="Titel" />)

    expect(container.querySelector("p")).toBeNull()
  })
})
