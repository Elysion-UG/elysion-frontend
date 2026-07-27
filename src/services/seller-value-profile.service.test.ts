import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { SellerValueProfileService } from "./seller-value-profile.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

describe("SellerValueProfileService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("get GETs /api/v1/users/me/seller/value-profile", async () => {
    mockApiRequest.mockResolvedValue({ level: "STANDARD" })
    await SellerValueProfileService.get()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me/seller/value-profile")
  })

  it("upsert PUTs the DTO", async () => {
    const dto = { level: "LEVEL_2" as const, payload: "{}", score: 42 }
    mockApiRequest.mockResolvedValue({ level: "LEVEL_2" })
    await SellerValueProfileService.upsert(dto)
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me/seller/value-profile", {
      method: "PUT",
      body: JSON.stringify(dto),
    })
  })

  it("propagates errors", async () => {
    mockApiRequest.mockRejectedValue(new Error("Forbidden"))
    await expect(SellerValueProfileService.upsert({ level: "STANDARD" })).rejects.toThrow(
      "Forbidden"
    )
  })
})
