import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { MonitoringService } from "./monitoring.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

describe("MonitoringService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("getErrors — calls GET /api/v1/admin/monitoring/errors with no params", async () => {
    mockApiRequest.mockResolvedValue({ items: [], page: 0, size: 25, totalItems: 0, totalPages: 0 })

    await MonitoringService.getErrors()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/monitoring/errors")
  })

  it("getErrors — appends filter query params", async () => {
    mockApiRequest.mockResolvedValue({ items: [], page: 0, size: 25, totalItems: 0, totalPages: 0 })

    await MonitoringService.getErrors({ page: 1, size: 50, severity: "HIGH", category: "API" })

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/monitoring/errors?page=1&size=50&severity=HIGH&category=API"
    )
  })

  it("getErrorStats — calls stats endpoint with hours param", async () => {
    mockApiRequest.mockResolvedValue({
      total: 0,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byCategory: { api: 0, auth: 0, render: 0, network: 0, unknown: 0 },
      errorsPerMinute: 0,
    })

    await MonitoringService.getErrorStats(48)

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/monitoring/errors/stats?hours=48")
  })

  it("getErrorStats — defaults to 24 hours", async () => {
    mockApiRequest.mockResolvedValue({
      total: 0,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byCategory: { api: 0, auth: 0, render: 0, network: 0, unknown: 0 },
      errorsPerMinute: 0,
    })

    await MonitoringService.getErrorStats()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/monitoring/errors/stats?hours=24")
  })
})
