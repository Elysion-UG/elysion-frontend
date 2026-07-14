import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import StatusBadge from "./StatusBadge"

describe("StatusBadge", () => {
  it("renders the label text", () => {
    render(<StatusBadge label="Active" colorClasses="bg-green-50 text-ink-900" />)
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("applies base classes and colorClasses", () => {
    render(<StatusBadge label="Pending" colorClasses="bg-warning-tint text-warning" />)
    const badge = screen.getByText("Pending")
    expect(badge.className).toContain("rounded-full")
    expect(badge.className).toContain("px-2")
    expect(badge.className).toContain("py-0.5")
    expect(badge.className).toContain("text-xs")
    expect(badge.className).toContain("font-medium")
    expect(badge.className).toContain("bg-warning-tint")
    expect(badge.className).toContain("text-warning")
  })

  it("merges additional className", () => {
    render(
      <StatusBadge label="Rejected" colorClasses="bg-danger-tint text-danger" className="ml-2" />
    )
    const badge = screen.getByText("Rejected")
    expect(badge.className).toContain("ml-2")
    expect(badge.className).toContain("bg-danger-tint")
  })
})
