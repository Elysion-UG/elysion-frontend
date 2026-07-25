import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { RecommendationService } from "./recommendation.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

describe("RecommendationService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("defaults to limit=6", async () => {
    mockApiRequest.mockResolvedValue([])
    await RecommendationService.getRecommendations()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/recommendations?limit=6")
  })

  it("passes an explicit limit", async () => {
    mockApiRequest.mockResolvedValue([])
    await RecommendationService.getRecommendations(12)
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/recommendations?limit=12")
  })

  it("returns the recommendations array", async () => {
    const recs = [{ productId: "p1" }, { productId: "p2" }]
    mockApiRequest.mockResolvedValue(recs)
    await expect(RecommendationService.getRecommendations()).resolves.toEqual(recs)
  })

  it("propagates errors", async () => {
    mockApiRequest.mockRejectedValue(new Error("Nicht autorisiert"))
    await expect(RecommendationService.getRecommendations()).rejects.toThrow("Nicht autorisiert")
  })
})
