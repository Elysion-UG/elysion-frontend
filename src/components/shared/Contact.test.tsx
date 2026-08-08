import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ApiError } from "@/src/lib/api-client"

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockOpenMailto = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastWarning = vi.fn()
const mockToastError = vi.fn()
const mockSend = vi.fn()

vi.mock("@/src/lib/contact", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/contact")>()
  return { ...actual, openMailto: (href: string) => mockOpenMailto(href) }
})

vi.mock("@/src/services/contact.service", () => ({
  ContactService: { send: (dto: unknown) => mockSend(dto) },
}))

vi.mock("sonner", () => ({
  toast: {
    success: (m: string) => mockToastSuccess(m),
    warning: (m: string) => mockToastWarning(m),
    error: (m: string) => mockToastError(m),
  },
}))

import Contact from "./Contact"

const ack = {
  id: "11111111-2222-3333-4444-555555555555",
  receivedAt: "2026-08-06T10:15:30Z",
  forwarded: true,
}

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

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /Nachricht senden/ }))
}

describe("Contact — POST /api/v1/contact (#120)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue(ack)
  })

  it("renders the support email as a mailto link", () => {
    render(<Contact />)
    const link = screen.getByRole("link", { name: "support@elysion.de" })
    expect(link).toHaveAttribute("href", "mailto:support@elysion.de")
  })

  it("posts the form data with the readable subject label", async () => {
    render(<Contact />)
    fillForm()
    submit()

    await waitFor(() => expect(mockSend).toHaveBeenCalledTimes(1))
    expect(mockSend).toHaveBeenCalledWith({
      name: "Max Mustermann",
      email: "max@example.com",
      subject: "Hilfe bei einer Bestellung",
      message: "Wo ist meine Bestellung?",
    })
    expect(mockOpenMailto).not.toHaveBeenCalled()
  })

  it("confirms with the reference number and clears the form on forwarded=true", async () => {
    render(<Contact />)
    fillForm()
    submit()

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledTimes(1))
    expect(screen.getByLabelText("Nachricht *")).toHaveValue("")
    // Die Referenz steht vollständig und bleibend auf der Seite — ein Toast ist
    // nach Sekunden weg, und abgeschnitten kann der Support nicht danach suchen.
    const confirmation = await screen.findByRole("status")
    expect(confirmation).toHaveTextContent(ack.id)
  })

  it("does not claim a notification went out when forwarded=false", async () => {
    mockSend.mockResolvedValue({ ...ack, forwarded: false })
    render(<Contact />)
    fillForm()
    submit()

    await waitFor(() => expect(mockToastWarning).toHaveBeenCalledTimes(1))
    expect(mockToastSuccess).not.toHaveBeenCalled()
    // Gespeichert ist die Anfrage trotzdem — und genau hier ist die vollständige
    // Referenz der einzige Beleg dafür.
    const confirmation = await screen.findByRole("status")
    expect(confirmation).toHaveTextContent(ack.id)
    expect(confirmation).toHaveTextContent(/steht noch aus/)
    expect(confirmation).toHaveTextContent(/geht nicht verloren/)
  })

  it("keeps the confirmation on screen instead of only in a toast", async () => {
    render(<Contact />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    fillForm()
    submit()
    // Kein Timer, kein Auto-Dismiss: die Quittung bleibt einfach stehen.
    await screen.findByRole("status")
    expect(screen.getByRole("status")).toHaveTextContent(ack.id)
  })

  // Der Vertrag verlangt name 2–100, subject 3–150, message 10–5000, email ≤320.
  // Ohne clientseitige Prüfung käme das englische "Validation failed" zurück.
  it("blocks a too-short message before the request and names the field", async () => {
    render(<Contact />)
    fillForm()
    fireEvent.change(screen.getByLabelText("Nachricht *"), { target: { value: "Hilfe!" } })
    submit()

    await waitFor(() => expect(mockToastError).toHaveBeenCalledTimes(1))
    expect(mockSend).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent(/mindestens 10 Zeichen/)
    expect(screen.getByLabelText("Nachricht *")).toHaveAttribute("aria-invalid", "true")
  })

  it("clears a field error as soon as the field is edited", async () => {
    render(<Contact />)
    fillForm()
    fireEvent.change(screen.getByLabelText("Nachricht *"), { target: { value: "kurz" } })
    submit()
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText("Nachricht *"), {
      target: { value: "Jetzt ausführlich genug." },
    })
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("never shows the server's raw English 'Validation failed' on a 400", async () => {
    mockSend.mockRejectedValue(new ApiError(400, "Validation failed"))
    render(<Contact />)
    fillForm()
    submit()

    await waitFor(() => expect(mockToastError).toHaveBeenCalledTimes(1))
    expect(mockToastError.mock.calls[0][0]).not.toContain("Validation failed")
    expect(mockToastError.mock.calls[0][0]).toMatch(/konnte nicht gesendet werden/)
  })

  it("surfaces the localised rate-limit message on 429", async () => {
    mockSend.mockRejectedValue(
      new ApiError(429, "Zu viele Anfragen — bitte in 60s erneut versuchen.")
    )
    render(<Contact />)
    fillForm()
    submit()

    await waitFor(() => expect(mockToastError).toHaveBeenCalledTimes(1))
    expect(mockToastError.mock.calls[0][0]).toBe(
      "Zu viele Anfragen — bitte in 60s erneut versuchen."
    )
  })

  it("offers the mailto fallback only after a failed send", async () => {
    mockSend.mockRejectedValue(new Error("network down"))
    render(<Contact />)
    expect(screen.queryByRole("button", { name: /E-Mail-Programm öffnen/ })).not.toBeInTheDocument()

    fillForm()
    submit()

    const fallback = await screen.findByRole("button", { name: /E-Mail-Programm öffnen/ })
    // Das Formular bleibt gefüllt, damit der Fallback denselben Text mitnimmt.
    expect(screen.getByLabelText("Nachricht *")).toHaveValue("Wo ist meine Bestellung?")

    fireEvent.click(fallback)
    expect(mockOpenMailto).toHaveBeenCalledTimes(1)
    const href = mockOpenMailto.mock.calls[0][0] as string
    expect(href.startsWith("mailto:support@elysion.de?")).toBe(true)
    expect(decodeURIComponent(href)).toContain("[Elysion Kontakt] Hilfe bei einer Bestellung")
  })

  it("blocks a double submit while the request is in flight", async () => {
    let resolveSend: (value: typeof ack) => void = () => {}
    mockSend.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve
        })
    )
    render(<Contact />)
    fillForm()
    submit()

    const button = await screen.findByRole("button", { name: /Wird gesendet/ })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(mockSend).toHaveBeenCalledTimes(1)

    resolveSend(ack)
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled())
  })
})
