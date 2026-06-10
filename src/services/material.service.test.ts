import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { MaterialService } from "./material.service"
import type { Material } from "@/src/types"

vi.mock("@/src/lib/api-client", () => ({
  apiRequest: vi.fn(),
}))

const mockApiRequest = vi.mocked(apiRequest)

const materials: Material[] = [
  { id: "m-1", slug: "leinen", name: "Leinen" },
  { id: "m-2", slug: "hanf", name: "Hanf" },
]

describe("MaterialService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("list — calls GET /api/v1/materials and returns the material list", async () => {
    mockApiRequest.mockResolvedValue(materials)

    const result = await MaterialService.list()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/materials")
    expect(result).toEqual(materials)
  })
})
