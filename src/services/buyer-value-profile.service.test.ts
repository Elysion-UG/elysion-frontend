import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { BuyerValueProfileService } from "./buyer-value-profile.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

describe("BuyerValueProfileService", () => {
  beforeEach(() => vi.clearAllMocks())

  describe("get", () => {
    it("GETs /api/v1/users/me/profile", async () => {
      mockApiRequest.mockResolvedValue({ activeProfileType: "NONE" })
      await BuyerValueProfileService.get()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me/profile")
    })

    it("maps the uppercase API profile type to lowercase", async () => {
      mockApiRequest.mockResolvedValue({ activeProfileType: "SIMPLE" })
      const result = await BuyerValueProfileService.get()
      expect(result.activeProfileType).toBe("simple")
    })

    it("parses JSON-string profile fields into objects", async () => {
      mockApiRequest.mockResolvedValue({
        activeProfileType: "EXTENDED",
        simpleProfile: JSON.stringify({ oeko: 5 }),
        extendedProfile: JSON.stringify({ oeko: { bio: 3 } }),
      })
      const result = await BuyerValueProfileService.get()
      expect(result.simpleProfile).toEqual({ oeko: 5 })
      expect(result.extendedProfile).toEqual({ oeko: { bio: 3 } })
    })

    it("returns null for a malformed JSON profile field instead of throwing", async () => {
      mockApiRequest.mockResolvedValue({
        activeProfileType: "SIMPLE",
        simpleProfile: "{not json",
      })
      const result = await BuyerValueProfileService.get()
      expect(result.simpleProfile).toBeNull()
    })

    // F3 (#173): valid JSON but the wrong shape must be rejected by the Zod guard,
    // not blindly cast through. Guards against backend contract drift / corrupt cache.
    it("returns null when the decoded value has the wrong shape", async () => {
      mockApiRequest.mockResolvedValue({
        activeProfileType: "SIMPLE",
        simpleProfile: JSON.stringify({ oeko: "not-a-number" }),
        extendedProfile: JSON.stringify(["array", "not", "record"]),
      })
      const result = await BuyerValueProfileService.get()
      expect(result.simpleProfile).toBeNull()
      expect(result.extendedProfile).toBeNull()
    })

    it("passes an already-parsed, well-shaped object through unchanged", async () => {
      mockApiRequest.mockResolvedValue({
        activeProfileType: "SIMPLE",
        simpleProfile: { oeko: 2 },
      })
      const result = await BuyerValueProfileService.get()
      expect(result.simpleProfile).toEqual({ oeko: 2 })
    })
  })

  describe("upsert", () => {
    it("serializes profile objects to JSON strings and uppercases the type", async () => {
      mockApiRequest.mockResolvedValue({ activeProfileType: "SIMPLE" })
      await BuyerValueProfileService.upsert({
        activeProfileType: "simple",
        simpleProfile: { oeko: 5 },
        extendedProfile: null,
      })
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          activeProfileType: "SIMPLE",
          simpleProfile: JSON.stringify({ oeko: 5 }),
          extendedProfile: null,
        }),
      })
    })

    it("sends null for absent profile fields", async () => {
      mockApiRequest.mockResolvedValue({ activeProfileType: "NONE" })
      await BuyerValueProfileService.upsert({
        activeProfileType: "none",
        simpleProfile: null,
        extendedProfile: null,
      })
      const body = JSON.parse(mockApiRequest.mock.calls[0][1]?.body as string)
      expect(body.simpleProfile).toBeNull()
      expect(body.extendedProfile).toBeNull()
      expect(body.activeProfileType).toBe("NONE")
    })
  })
})
