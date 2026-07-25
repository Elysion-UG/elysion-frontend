import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { SellerProfileService } from "./seller-profile.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

describe("SellerProfileService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("get GETs /api/v1/users/me/seller-profile", async () => {
    mockApiRequest.mockResolvedValue({ companyName: "Acme" })
    await SellerProfileService.get()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me/seller-profile")
  })

  it("update PATCHes the DTO", async () => {
    mockApiRequest.mockResolvedValue({ companyName: "Neu GmbH" })
    await SellerProfileService.update({ companyName: "Neu GmbH" })
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me/seller-profile", {
      method: "PATCH",
      body: JSON.stringify({ companyName: "Neu GmbH" }),
    })
  })

  it("propagates errors", async () => {
    mockApiRequest.mockRejectedValue(new Error("Forbidden"))
    await expect(SellerProfileService.get()).rejects.toThrow("Forbidden")
  })
})
