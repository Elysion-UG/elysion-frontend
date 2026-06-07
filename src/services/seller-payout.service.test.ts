import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { SellerPayoutService } from "./seller-payout.service"
import type { SellerPayoutAccount } from "@/src/types"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

describe("SellerPayoutService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("getAccount — calls GET /api/v1/seller/payout-account", async () => {
    const account: SellerPayoutAccount = {
      status: "ACTIVE",
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
    }
    mockApiRequest.mockResolvedValue(account)

    const result = await SellerPayoutService.getAccount()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/payout-account")
    expect(result).toEqual(account)
  })

  it("createOnboardingLink — POST /api/v1/seller/payout-account/onboarding-link", async () => {
    mockApiRequest.mockResolvedValue({ url: "https://connect.stripe.com/setup/abc" })

    const result = await SellerPayoutService.createOnboardingLink()

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/seller/payout-account/onboarding-link",
      expect.objectContaining({ method: "POST" })
    )
    expect(result.url).toContain("stripe.com")
  })
})
