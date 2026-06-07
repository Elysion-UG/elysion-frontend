import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import StatusBadge from "./StatusBadge"

describe("StatusBadge", () => {
  it("renders the label text", () => {
    render(<StatusBadge label="Active" colorClasses="bg-green-100 text-green-800" />)
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("applies base classes and colorClasses", () => {
    render(<StatusBadge label="Pending" colorClasses="bg-yellow-900/40 text-yellow-400" />)
    const badge = screen.getByText("Pending")
    expect(badge.className).toContain("rounded-full")
    expect(badge.className).toContain("px-2")
    expect(badge.className).toContain("py-0.5")
    expect(badge.className).toContain("text-xs")
    expect(badge.className).toContain("font-medium")
    expect(badge.className).toContain("bg-yellow-900/40")
    expect(badge.className).toContain("text-yellow-400")
  })

  it("merges additional className", () => {
    render(<StatusBadge label="Rejected" colorClasses="bg-red-100 text-red-800" className="ml-2" />)
    const badge = screen.getByText("Rejected")
    expect(badge.className).toContain("ml-2")
    expect(badge.className).toContain("bg-red-100")
  })
})
