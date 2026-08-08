import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest, ApiError } from "@/src/lib/api-client"
import { ContactService } from "./contact.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

const dto = {
  name: "Erika Mustermann",
  email: "erika@example.com",
  subject: "Frage zur Lieferzeit",
  message: "Wann wird meine Bestellung versandt?",
}

const acknowledgement = {
  id: "11111111-2222-3333-4444-555555555555",
  receivedAt: "2026-08-06T10:15:30Z",
  forwarded: true,
}

describe("ContactService.send", () => {
  beforeEach(() => vi.clearAllMocks())

  it("POSTs the form data to the public contact endpoint", async () => {
    mockApiRequest.mockResolvedValue(acknowledgement)
    await ContactService.send(dto)
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/contact", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  })

  it("returns the parsed acknowledgement", async () => {
    mockApiRequest.mockResolvedValue(acknowledgement)
    await expect(ContactService.send(dto)).resolves.toEqual(acknowledgement)
  })

  it("keeps forwarded=false — the message is stored, only the notification is pending", async () => {
    mockApiRequest.mockResolvedValue({ ...acknowledgement, forwarded: false })
    const result = await ContactService.send(dto)
    expect(result.forwarded).toBe(false)
    expect(result.id).toBe(acknowledgement.id)
  })

  it("rejects a response missing the forwarded flag instead of casting it through", async () => {
    mockApiRequest.mockResolvedValue({ id: "abc", receivedAt: "2026-08-06T10:15:30Z" })
    await expect(ContactService.send(dto)).rejects.toThrow(/Ungültige Server-Antwort/)
  })

  it("rejects a non-boolean forwarded flag", async () => {
    mockApiRequest.mockResolvedValue({ ...acknowledgement, forwarded: "yes" })
    await expect(ContactService.send(dto)).rejects.toThrow(/Ungültige Server-Antwort/)
  })

  it("passes a rate-limit error through unchanged (429 is localised by the api-client)", async () => {
    mockApiRequest.mockRejectedValue(
      new ApiError(429, "Zu viele Anfragen — bitte in 60s erneut versuchen.")
    )
    await expect(ContactService.send(dto)).rejects.toMatchObject({ status: 429 })
  })
})
