import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { ApiSchemaError } from "@/src/lib/api-schemas"
import { AdminOrderDuplicateService } from "./admin-order-duplicate.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

const apiOrderRef = (overrides: Record<string, unknown> = {}) => ({
  id: "11111111-2222-3333-4444-555555555555",
  orderNumber: "ORD-1001",
  userId: null,
  guestEmail: "kundin@example.com",
  status: "CONFIRMED",
  paymentStatus: "SUCCEEDED",
  total: 129.9,
  currency: "EUR",
  ...overrides,
})

const apiFlag = (overrides: Record<string, unknown> = {}) => ({
  id: "flag-1",
  status: "OPEN",
  matchSignature: "a".repeat(64),
  secondsApart: 45,
  detectedAt: "2026-03-23T04:15:00Z",
  resolution: null,
  resolutionNote: null,
  resolvedBy: null,
  resolvedAt: null,
  order: apiOrderRef({ id: "order-late", orderNumber: "ORD-1002" }),
  duplicateOf: apiOrderRef({ id: "order-early" }),
  ...overrides,
})

const apiPage = (items: unknown[]) => ({
  items,
  page: 0,
  size: 25,
  totalItems: items.length,
  totalPages: 1,
})

describe("AdminOrderDuplicateService.list", () => {
  beforeEach(() => vi.clearAllMocks())

  it("ruft GET /api/v1/admin/orders/duplicates ohne Parameter auf", async () => {
    mockApiRequest.mockResolvedValue(apiPage([]))

    await AdminOrderDuplicateService.list()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/orders/duplicates")
  })

  it("hängt page, size und status als Query an", async () => {
    mockApiRequest.mockResolvedValue(apiPage([]))

    await AdminOrderDuplicateService.list({ page: 2, size: 25, status: "OPEN" })

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/orders/duplicates?page=2&size=25&status=OPEN"
    )
  })

  it("mappt ein Flag samt beider Bestellungen in den Domänentyp", async () => {
    mockApiRequest.mockResolvedValue(apiPage([apiFlag()]))

    const page = await AdminOrderDuplicateService.list()

    expect(page.totalItems).toBe(1)
    expect(page.items[0]).toEqual({
      id: "flag-1",
      status: "OPEN",
      matchSignature: "a".repeat(64),
      secondsApart: 45,
      detectedAt: "2026-03-23T04:15:00Z",
      resolution: null,
      resolutionNote: null,
      resolvedBy: null,
      resolvedAt: null,
      order: {
        id: "order-late",
        orderNumber: "ORD-1002",
        userId: null,
        guestEmail: "kundin@example.com",
        status: "CONFIRMED",
        paymentStatus: "SUCCEEDED",
        total: 129.9,
        currency: "EUR",
      },
      duplicateOf: {
        id: "order-early",
        orderNumber: "ORD-1001",
        userId: null,
        guestEmail: "kundin@example.com",
        status: "CONFIRMED",
        paymentStatus: "SUCCEEDED",
        total: 129.9,
        currency: "EUR",
      },
    })
  })

  it("übernimmt die Entscheidungsfelder eines entschiedenen Flags", async () => {
    mockApiRequest.mockResolvedValue(
      apiPage([
        apiFlag({
          status: "RESOLVED",
          resolution: "CANCELLED_REFUNDED",
          resolutionNote: "Versehen",
          resolvedBy: "admin-1",
          resolvedAt: "2026-03-23T09:00:00Z",
        }),
      ])
    )

    const page = await AdminOrderDuplicateService.list({ status: "RESOLVED" })

    expect(page.items[0]).toMatchObject({
      status: "RESOLVED",
      resolution: "CANCELLED_REFUNDED",
      resolutionNote: "Versehen",
      resolvedBy: "admin-1",
      resolvedAt: "2026-03-23T09:00:00Z",
    })
  })

  // Fehlt die Bestellung zum Flag, liefert das Backend einen reinen Id-Stub.
  // Der darf die Liste nicht kippen, sondern muss als lauter null ankommen.
  it("verträgt Bestell-Stubs ohne geladene Bestellung", async () => {
    mockApiRequest.mockResolvedValue(
      apiPage([
        apiFlag({
          order: {
            id: "order-late",
            orderNumber: null,
            userId: null,
            guestEmail: null,
            status: null,
            paymentStatus: null,
            total: null,
            currency: null,
          },
        }),
      ])
    )

    const page = await AdminOrderDuplicateService.list()

    expect(page.items[0].order).toEqual({
      id: "order-late",
      orderNumber: null,
      userId: null,
      guestEmail: null,
      status: null,
      paymentStatus: null,
      total: null,
      currency: null,
    })
  })

  it("normalisiert fehlende optionale Felder zu null statt undefined", async () => {
    mockApiRequest.mockResolvedValue(
      apiPage([
        {
          id: "flag-2",
          status: "OPEN",
          matchSignature: "b".repeat(64),
          secondsApart: 900,
          detectedAt: "2026-03-23T04:15:00Z",
          order: { id: "order-late" },
          duplicateOf: { id: "order-early" },
        },
      ])
    )

    const page = await AdminOrderDuplicateService.list()

    expect(page.items[0].resolution).toBeNull()
    expect(page.items[0].resolutionNote).toBeNull()
    expect(page.items[0].order.orderNumber).toBeNull()
  })

  it("scheitert laut bei einem unbekannten Flag-Status (Contract Drift)", async () => {
    mockApiRequest.mockResolvedValue(apiPage([apiFlag({ status: "IN_REVIEW" })]))

    await expect(AdminOrderDuplicateService.list()).rejects.toBeInstanceOf(ApiSchemaError)
  })

  it("scheitert laut bei einer unbekannten Resolution", async () => {
    mockApiRequest.mockResolvedValue(
      apiPage([apiFlag({ status: "RESOLVED", resolution: "MERGED" })])
    )

    await expect(AdminOrderDuplicateService.list()).rejects.toBeInstanceOf(ApiSchemaError)
  })
})

describe("AdminOrderDuplicateService.stats", () => {
  beforeEach(() => vi.clearAllMocks())

  it("liest die Zählerstände", async () => {
    mockApiRequest.mockResolvedValue({ total: 12, open: 3, resolved: 9 })

    const stats = await AdminOrderDuplicateService.stats()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/orders/duplicates/stats")
    expect(stats).toEqual({ total: 12, open: 3, resolved: 9 })
  })

  it("scheitert laut, wenn ein Zähler fehlt", async () => {
    mockApiRequest.mockResolvedValue({ total: 12, open: 3 })

    await expect(AdminOrderDuplicateService.stats()).rejects.toBeInstanceOf(ApiSchemaError)
  })
})

describe("AdminOrderDuplicateService.resolve", () => {
  beforeEach(() => vi.clearAllMocks())

  const resolveResponse = {
    id: "flag-1",
    orderId: "order-late",
    duplicateOfOrderId: "order-early",
    status: "RESOLVED",
    resolution: "CANCELLED_REFUNDED",
    resolutionNote: "Versehen",
    resolvedBy: "admin-1",
    resolvedAt: "2026-03-23T09:00:00Z",
  }

  it("postet Resolution und Notiz an den Resolve-Endpoint", async () => {
    mockApiRequest.mockResolvedValue(resolveResponse)

    await AdminOrderDuplicateService.resolve("flag-1", {
      resolution: "CANCELLED_REFUNDED",
      note: "Versehen",
    })

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/orders/duplicates/flag-1/resolve", {
      method: "POST",
      body: JSON.stringify({ resolution: "CANCELLED_REFUNDED", note: "Versehen" }),
    })
  })

  it("sendet ohne Notiz nur die Resolution", async () => {
    mockApiRequest.mockResolvedValue({ ...resolveResponse, resolution: "RELEASED" })

    await AdminOrderDuplicateService.resolve("flag-1", { resolution: "RELEASED" })

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/orders/duplicates/flag-1/resolve", {
      method: "POST",
      body: JSON.stringify({ resolution: "RELEASED" }),
    })
  })

  it("gibt das Ergebnis mit null statt undefined zurück", async () => {
    mockApiRequest.mockResolvedValue({
      ...resolveResponse,
      resolutionNote: null,
      resolvedBy: null,
    })

    const result = await AdminOrderDuplicateService.resolve("flag-1", {
      resolution: "CANCELLED_REFUNDED",
    })

    expect(result).toEqual({
      id: "flag-1",
      orderId: "order-late",
      duplicateOfOrderId: "order-early",
      status: "RESOLVED",
      resolution: "CANCELLED_REFUNDED",
      resolutionNote: null,
      resolvedBy: null,
      resolvedAt: "2026-03-23T09:00:00Z",
    })
  })

  it("scheitert laut, wenn die Antwort keine Resolution trägt", async () => {
    mockApiRequest.mockResolvedValue({ ...resolveResponse, resolution: null })

    await expect(
      AdminOrderDuplicateService.resolve("flag-1", { resolution: "RELEASED" })
    ).rejects.toBeInstanceOf(ApiSchemaError)
  })
})
