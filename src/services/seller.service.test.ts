import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest, ApiError } from "@/src/lib/api-client"
import { SellerService } from "./seller.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

const rawProfile = {
  id: "8f1c2b7e-1c3d-4a5b-9e0f-2a4b6c8d0e1f",
  slug: "alpha-manufaktur",
  companyName: "Alpha Manufaktur",
  description: "Wir weben seit 1920 in Ostwestfalen.",
  location: "Bielefeld, DE",
  foundedYear: 1920,
  sustainabilityScore: 87,
  certifications: [
    {
      certificateId: "c1a2b3c4-0000-4000-8000-000000000001",
      certificateType: "ORGANIC",
      title: "EU Organic Certificate",
      issuerName: "Control Union",
      certificateNumber: "ABC-123",
      issueDate: "2025-01-01",
      expiryDate: "2027-01-01",
      status: "VERIFIED",
    },
  ],
}

describe("SellerService.getPublicProfile", () => {
  beforeEach(() => vi.clearAllMocks())

  it("GETs the slug route", async () => {
    mockApiRequest.mockResolvedValue(rawProfile)
    await SellerService.getPublicProfile("alpha-manufaktur")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/sellers/alpha-manufaktur")
  })

  it("encodes the slug so it cannot escape the path segment", async () => {
    mockApiRequest.mockResolvedValue(rawProfile)
    await SellerService.getPublicProfile("alpha/../admin")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/sellers/alpha%2F..%2Fadmin")
  })

  it("returns the profile including its verified certificates", async () => {
    mockApiRequest.mockResolvedValue(rawProfile)
    const profile = await SellerService.getPublicProfile("alpha-manufaktur")
    expect(profile).toMatchObject({
      id: rawProfile.id,
      slug: "alpha-manufaktur",
      companyName: "Alpha Manufaktur",
      location: "Bielefeld, DE",
      foundedYear: 1920,
      sustainabilityScore: 87,
    })
    expect(profile.certifications).toHaveLength(1)
    expect(profile.certifications[0].title).toBe("EU Organic Certificate")
  })

  it("maps the optional null fields to undefined", async () => {
    mockApiRequest.mockResolvedValue({
      ...rawProfile,
      description: null,
      location: null,
      foundedYear: null,
      sustainabilityScore: null,
      certifications: [],
    })
    const profile = await SellerService.getPublicProfile("alpha-manufaktur")
    expect(profile.description).toBeUndefined()
    expect(profile.location).toBeUndefined()
    expect(profile.foundedYear).toBeUndefined()
    expect(profile.sustainabilityScore).toBeUndefined()
    expect(profile.certifications).toEqual([])
  })

  it("treats a missing certifications array as empty", async () => {
    const { certifications: _ignored, ...withoutCerts } = rawProfile
    mockApiRequest.mockResolvedValue(withoutCerts)
    const profile = await SellerService.getPublicProfile("alpha-manufaktur")
    expect(profile.certifications).toEqual([])
  })

  it("rejects a response without a slug instead of casting it through", async () => {
    mockApiRequest.mockResolvedValue({ id: "abc", companyName: "Alpha" })
    await expect(SellerService.getPublicProfile("alpha")).rejects.toThrow(
      /Ungültige Server-Antwort/
    )
  })

  it("passes the 404 of an unknown or unapproved seller through", async () => {
    mockApiRequest.mockRejectedValue(new ApiError(404, "Seller profile not found"))
    await expect(SellerService.getPublicProfile("ghost")).rejects.toMatchObject({ status: 404 })
  })
})
