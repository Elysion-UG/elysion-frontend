import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockOpenMailto = vi.fn()
const mockToastSuccess = vi.fn()

vi.mock("@/src/lib/contact", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/contact")>()
  return { ...actual, openMailto: (href: string) => mockOpenMailto(href) }
})

vi.mock("sonner", () => ({
  toast: { success: (m: string) => mockToastSuccess(m), error: vi.fn() },
}))

import Contact from "./Contact"

function fillForm() {
  fireEvent.change(screen.getByLabelText("Vollständiger Name *"), {
    target: { value: "Max Mustermann" },
  })
  fireEvent.change(screen.getByLabelText("E-Mail-Adresse *"), {
    target: { value: "max@example.com" },
  })
  fireEvent.change(screen.getByLabelText("Betreff *"), { target: { value: "order" } })
  fireEvent.change(screen.getByLabelText("Nachricht *"), {
    target: { value: "Wo ist meine Bestellung?" },
  })
}

describe("Contact — mailto submission", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the support email as a mailto link", () => {
    render(<Contact />)
    const link = screen.getByRole("link", { name: "support@elysion.de" })
    expect(link).toHaveAttribute("href", "mailto:support@elysion.de")
  })

  it("opens the mail client with the prefilled message on submit", () => {
    render(<Contact />)
    fillForm()
    fireEvent.click(screen.getByRole("button", { name: /Nachricht per E-Mail senden/ }))

    expect(mockOpenMailto).toHaveBeenCalledTimes(1)
    const href = mockOpenMailto.mock.calls[0][0] as string
    expect(href.startsWith("mailto:support@elysion.de?")).toBe(true)
    const decoded = decodeURIComponent(href)
    expect(decoded).toContain("[Elysion Kontakt] Hilfe bei einer Bestellung")
    expect(decoded).toContain("Name: Max Mustermann")
    expect(decoded).toContain("Wo ist meine Bestellung?")
  })

  it("shows a confirmation toast after opening the mail client", () => {
    render(<Contact />)
    fillForm()
    fireEvent.click(screen.getByRole("button", { name: /Nachricht per E-Mail senden/ }))

    expect(mockToastSuccess).toHaveBeenCalledTimes(1)
    expect(mockToastSuccess.mock.calls[0][0]).toContain("support@elysion.de")
  })

  it("does not claim the message was sent (no fake success screen)", () => {
    render(<Contact />)
    fillForm()
    fireEvent.click(screen.getByRole("button", { name: /Nachricht per E-Mail senden/ }))

    expect(screen.queryByText(/Nachricht wurde gesendet/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Vielen Dank für Ihre Nachricht/i)).not.toBeInTheDocument()
    // form is still present
    expect(screen.getByLabelText("Nachricht *")).toBeInTheDocument()
  })
})
