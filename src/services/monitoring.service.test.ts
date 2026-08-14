import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { MonitoringService } from "./monitoring.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

/**
 * Antworten in der Schreibweise, die der Server laut `docs/monitoring-api.md`
 * wirklich liefert: UPPERCASE. Die frühere Fassung dieser Tests fütterte
 * lowercase und war deshalb grün, obwohl der Vertrag das Gegenteil sagt — sie
 * hat den Bug aus #254 zementiert statt ihn zu finden.
 */
const apiEvent = {
  id: "evt-1",
  clientEventId: "client-1",
  sessionId: "sess-1",
  severity: "HIGH",
  category: "API",
  message: "Request failed: GET /api/v1/products returned 500",
  stack: "Error: Request failed",
  url: "https://shop.example.com/products",
  apiPath: "/api/v1/products",
  statusCode: 500,
  component: null,
  userId: "user-1",
  userAgent: "Mozilla/5.0",
  metadata: { customField: "value" },
  clientTimestamp: "2026-04-04T12:34:56.789Z",
  createdAt: "2026-04-04T12:35:02.123Z",
}

const apiPage = { items: [apiEvent], page: 0, size: 25, totalItems: 1, totalPages: 1 }

const apiStats = {
  total: 142,
  bySeverity: { CRITICAL: 2, HIGH: 15, MEDIUM: 80, LOW: 45 },
  byCategory: { API: 60, AUTH: 10, RENDER: 30, NETWORK: 40, UNKNOWN: 2 },
  errorsPerMinute: 0.1,
}

describe("MonitoringService", () => {
  beforeEach(() => vi.clearAllMocks())

  describe("getErrors", () => {
    it("calls GET /api/v1/admin/monitoring/errors with no params", async () => {
      mockApiRequest.mockResolvedValue(apiPage)

      await MonitoringService.getErrors()

      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/monitoring/errors")
    })

    it("appends filter query params — Filter gehen UPPERCASE raus", async () => {
      mockApiRequest.mockResolvedValue(apiPage)

      await MonitoringService.getErrors({ page: 1, size: 50, severity: "HIGH", category: "API" })

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/admin/monitoring/errors?page=1&size=50&severity=HIGH&category=API"
      )
    })

    it("übersetzt severity/category der Antwort nach lowercase (#254)", async () => {
      mockApiRequest.mockResolvedValue(apiPage)

      const page = await MonitoringService.getErrors()

      expect(page.items[0].severity).toBe("high")
      expect(page.items[0].category).toBe("api")
    })

    it("normalisiert das Envelope zu Page<T> und reicht die übrigen Felder durch", async () => {
      mockApiRequest.mockResolvedValue(apiPage)

      const page = await MonitoringService.getErrors()

      expect(page).toMatchObject({ page: 0, size: 25, totalItems: 1, totalPages: 1 })
      expect(page.items[0]).toMatchObject({
        id: "evt-1",
        clientEventId: "client-1",
        statusCode: 500,
        metadata: { customField: "value" },
        clientTimestamp: "2026-04-04T12:34:56.789Z",
      })
    })

    it("normalisiert fehlende Optionalfelder zu null statt undefined", async () => {
      const { sessionId: _s, stack: _st, metadata: _m, ...lean } = apiEvent
      mockApiRequest.mockResolvedValue({ ...apiPage, items: [lean] })

      const page = await MonitoringService.getErrors()

      expect(page.items[0].sessionId).toBeNull()
      expect(page.items[0].stack).toBeNull()
      expect(page.items[0].metadata).toBeNull()
    })

    it("scheitert laut bei unbekanntem severity-Wert statt ihn durchzureichen", async () => {
      mockApiRequest.mockResolvedValue({
        ...apiPage,
        items: [{ ...apiEvent, severity: "WARNING" }],
      })

      // Nicht irgendein Fehler: die Schema-Validierung muss greifen und die
      // Fehlerquelle benennen — sonst wäre der Test auch bei einem TypeError grün.
      await expect(MonitoringService.getErrors()).rejects.toThrow(/monitoring\.getErrors/)
    })

    it("scheitert laut, wenn ein Pflichtfeld fehlt", async () => {
      const { message: _m, ...withoutMessage } = apiEvent
      mockApiRequest.mockResolvedValue({ ...apiPage, items: [withoutMessage] })

      await expect(MonitoringService.getErrors()).rejects.toThrow()
    })
  })

  describe("getErrorStats", () => {
    it("calls stats endpoint with hours param", async () => {
      mockApiRequest.mockResolvedValue(apiStats)

      await MonitoringService.getErrorStats(48)

      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/monitoring/errors/stats?hours=48")
    })

    it("defaults to 24 hours", async () => {
      mockApiRequest.mockResolvedValue(apiStats)

      await MonitoringService.getErrorStats()

      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/monitoring/errors/stats?hours=24")
    })

    it("übersetzt die Record-Schlüssel nach lowercase (#254)", async () => {
      mockApiRequest.mockResolvedValue(apiStats)

      const stats = await MonitoringService.getErrorStats()

      expect(stats.bySeverity).toEqual({ critical: 2, high: 15, medium: 80, low: 45 })
      expect(stats.byCategory).toEqual({ api: 60, auth: 10, render: 30, network: 40, unknown: 2 })
      expect(stats).toMatchObject({ total: 142, errorsPerMinute: 0.1 })
    })

    it("füllt weggelassene Stufen mit 0 statt undefined", async () => {
      mockApiRequest.mockResolvedValue({ ...apiStats, bySeverity: { HIGH: 15 }, byCategory: {} })

      const stats = await MonitoringService.getErrorStats()

      expect(stats.bySeverity).toEqual({ critical: 0, high: 15, medium: 0, low: 0 })
      expect(stats.byCategory).toEqual({ api: 0, auth: 0, render: 0, network: 0, unknown: 0 })
    })

    it("scheitert laut bei lowercase-Schlüsseln — genau der Drift aus #254", async () => {
      mockApiRequest.mockResolvedValue({
        ...apiStats,
        bySeverity: { critical: 2, high: 15, medium: 80, low: 45 },
      })

      await expect(MonitoringService.getErrorStats()).rejects.toThrow(/monitoring\.getErrorStats/)
    })
  })
})
