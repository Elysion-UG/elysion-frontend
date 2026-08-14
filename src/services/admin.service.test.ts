import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { AdminService } from "./admin.service"
import type { Page, AdminUserListItem } from "@/src/types"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

const mockPagedResponse = <T>(items: T[]): Page<T> => ({
  items,
  page: 0,
  size: 20,
  totalItems: items.length,
  totalPages: 1,
})

describe("AdminService", () => {
  beforeEach(() => vi.clearAllMocks())

  // ── User moderation ──────────────────────────────────────────────────

  it("listUsers — calls GET /api/v1/admin/users with no params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listUsers()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/users")
  })

  it("listUsers — appends page, size, search, role, status query params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listUsers({
      page: 1,
      pageSize: 10,
      search: "alice",
      role: "BUYER",
      status: "ACTIVE",
    })

    // page is passed through 0-based, consistent with all list endpoints (#36)
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/users?page=1&size=10&search=alice&role=BUYER&status=ACTIVE"
    )
  })

  it("listUsers — omits absent params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listUsers({ page: 1 })

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/users?page=1")
  })

  it("getUser — calls GET /api/v1/admin/users/:id", async () => {
    const mockUser = {
      id: "u1",
      email: "a@b.com",
      role: "BUYER",
      status: "ACTIVE",
      emailVerified: true,
      createdAt: "",
    }
    mockApiRequest.mockResolvedValue(mockUser)

    const result = await AdminService.getUser("u1")

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/users/u1")
    expect(result).toEqual(mockUser)
  })

  it("suspendUser — calls POST /api/v1/admin/users/:id/suspend", async () => {
    mockApiRequest.mockResolvedValue({ userId: "u1", status: "SUSPENDED" })

    const result = await AdminService.suspendUser("u1")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/users/u1/suspend",
      expect.objectContaining({ method: "POST" })
    )
    expect(result).toMatchObject({ userId: "u1", status: "SUSPENDED" })
  })

  it("activateUser — calls POST /api/v1/admin/users/:id/unsuspend", async () => {
    mockApiRequest.mockResolvedValue({ userId: "u1", status: "ACTIVE" })

    const result = await AdminService.activateUser("u1")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/users/u1/unsuspend",
      expect.objectContaining({ method: "POST" })
    )
    expect(result).toMatchObject({ status: "ACTIVE" })
  })

  // ── Seller profile review ────────────────────────────────────────────

  it("approveSellerProfile — calls POST /api/v1/admin/sellers/:id/approve", async () => {
    mockApiRequest.mockResolvedValue({ id: "sp1", status: "APPROVED" })

    await AdminService.approveSellerProfile("sp1")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/sellers/sp1/approve",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("rejectSellerProfile — calls POST /api/v1/admin/sellers/:id/reject with reason", async () => {
    mockApiRequest.mockResolvedValue({ id: "sp1", status: "REJECTED" })

    await AdminService.rejectSellerProfile("sp1", "Incomplete docs")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/sellers/sp1/reject",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ reason: "Incomplete docs" }),
      })
    )
  })

  it("suspendSellerProfile — calls POST /api/v1/admin/sellers/:id/suspend with reason", async () => {
    mockApiRequest.mockResolvedValue({ id: "sp1", status: "SUSPENDED" })

    await AdminService.suspendSellerProfile("sp1", "Policy violation")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/sellers/sp1/suspend",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ reason: "Policy violation" }),
      })
    )
  })

  // ── Certificate verification ─────────────────────────────────────────

  it("verifyCertificate — calls PATCH /api/v1/admin/certificates/:id/verify", async () => {
    mockApiRequest.mockResolvedValue({
      id: "cert-1",
      status: "VERIFIED",
      verifiedByAdminId: "admin-1",
      verifiedAt: "",
      rejectionReason: null,
    })

    const result = await AdminService.verifyCertificate("cert-1")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/certificates/cert-1/verify",
      expect.objectContaining({ method: "PATCH" })
    )
    expect(result).toMatchObject({ status: "VERIFIED" })
  })

  it("rejectCertificate — calls PATCH /api/v1/admin/certificates/:id/reject with reason", async () => {
    mockApiRequest.mockResolvedValue({
      id: "cert-1",
      status: "REJECTED",
      verifiedByAdminId: null,
      verifiedAt: null,
      rejectionReason: "Expired",
    })

    await AdminService.rejectCertificate("cert-1", "Expired")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/certificates/cert-1/reject",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ reason: "Expired" }) })
    )
  })

  // ── List endpoints ────────────────────────────────────────────────────

  it("listSellers — calls GET /api/v1/admin/sellers with no params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listSellers()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/sellers")
  })

  it("listSellers — appends page, size, status params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listSellers({ page: 0, size: 5, status: "PENDING" })

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/sellers?page=0&size=5&status=PENDING"
    )
  })

  it("listOrders — calls GET /api/v1/admin/orders with no params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listOrders()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/orders")
  })

  it("listOrders — appends page, size, status params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listOrders({ page: 1, size: 25, status: "PAID" })

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/orders?page=1&size=25&status=PAID")
  })

  it("listProducts — calls GET /api/v1/admin/products with no params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listProducts()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/products")
  })

  it("listProducts — appends page, size, search params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listProducts({ page: 0, size: 10, search: "shirt" })

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/products?page=0&size=10&search=shirt"
    )
  })

  it("activateProduct — calls POST /api/v1/admin/products/:id/activate", async () => {
    mockApiRequest.mockResolvedValue({ id: "p1", status: "ACTIVE" })

    const result = await AdminService.activateProduct("p1")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/products/p1/activate",
      expect.objectContaining({ method: "POST" })
    )
    expect(result).toMatchObject({ status: "ACTIVE" })
  })

  it("deactivateProduct — calls POST /api/v1/admin/products/:id/deactivate", async () => {
    mockApiRequest.mockResolvedValue({ id: "p1", status: "INACTIVE" })

    const result = await AdminService.deactivateProduct("p1")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/products/p1/deactivate",
      expect.objectContaining({ method: "POST" })
    )
    expect(result).toMatchObject({ status: "INACTIVE" })
  })

  it("listPayments — calls GET /api/v1/admin/payments with no params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listPayments()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/payments")
  })

  it("listPayments — appends page and size params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listPayments({ page: 2, size: 50 })

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/payments?page=2&size=50")
  })

  it("listRefunds — calls GET /api/v1/admin/refunds with no params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listRefunds()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/refunds")
  })

  it("listRefunds — appends page and size params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listRefunds({ page: 0, size: 10 })

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/refunds?page=0&size=10")
  })

  it("listSettlements — calls GET /api/v1/admin/settlements with no params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listSettlements()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/settlements")
  })

  it("listSettlements — appends page and size params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listSettlements({ page: 1, size: 20 })

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/settlements?page=1&size=20")
  })

  // ── Gebührenkette (#53) ──────────────────────────────────────────────
  //
  // Seller- und Admin-Sicht teilen sich einen Zeilenvertrag; hier steht die
  // Admin-Seite, die Seller-Seite in `seller-order.service.test.ts`.

  const rawSettlement = {
    settlementId: "stl_1",
    orderGroupId: "grp_1",
    sellerId: "seller_1",
    grossAmount: 110.0,
    goodsAmount: 100.0,
    shippingAmount: 10.0,
    refundedAmount: 10.0,
    platformFeeAmount: 15.0,
    stripeFeeAmount: 1.9,
    refundFeeAmount: 0.4,
    chargebackAmount: 15.0,
    netAmount: 68.1,
    currency: "EUR",
    status: "PENDING",
    adjustmentRequired: true,
    eligibleAt: "2026-02-01T10:00:00Z",
    createdAt: "2026-01-20T10:00:00Z",
  }

  it("listSettlements — reicht die vollständige Gebührenkette durch", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([rawSettlement]))

    const page = await AdminService.listSettlements()

    expect(page.totalItems).toBe(1)
    expect(page.items[0]).toMatchObject({
      grossAmount: 110.0,
      refundedAmount: 10.0,
      platformFeeAmount: 15.0,
      stripeFeeAmount: 1.9,
      refundFeeAmount: 0.4,
      chargebackAmount: 15.0,
      netAmount: 68.1,
    })
  })

  it("listSettlements — lehnt eine Zeile ohne Chargeback-Feld ab statt sie zu casten", async () => {
    const incomplete: Record<string, unknown> = { ...rawSettlement }
    delete incomplete.chargebackAmount
    mockApiRequest.mockResolvedValue(mockPagedResponse([incomplete]))

    await expect(AdminService.listSettlements()).rejects.toThrow(/Ungültige Server-Antwort/)
  })

  it("listPayouts — calls GET /api/v1/admin/payouts with no params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listPayouts()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/payouts")
  })

  it("listPayouts — appends page and size params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listPayouts({ page: 0, size: 15 })

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/payouts?page=0&size=15")
  })

  // ── Maintenance ───────────────────────────────────────────────────────

  it("cleanupRefreshTokens — calls POST /api/v1/admin/maintenance/cleanup-refresh-tokens", async () => {
    mockApiRequest.mockResolvedValue({ deletedCount: 42 })

    const result = await AdminService.cleanupRefreshTokens()

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/maintenance/cleanup-refresh-tokens",
      expect.objectContaining({ method: "POST" })
    )
    expect(result).toEqual({ deletedCount: 42 })
  })

  it("expirePendingOrders — calls POST /api/v1/admin/maintenance/expire-pending-orders", async () => {
    mockApiRequest.mockResolvedValue({ expiredCount: 7 })

    const result = await AdminService.expirePendingOrders()

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/maintenance/expire-pending-orders",
      expect.objectContaining({ method: "POST" })
    )
    expect(result).toEqual({ expiredCount: 7 })
  })

  // ── Commission & payouts ───────────────────────────────────────────────

  it("updateSellerCommission — PATCH /api/v1/admin/sellers/:id/commission with rate body", async () => {
    mockApiRequest.mockResolvedValue({ id: "s1", commissionRate: 12 })

    await AdminService.updateSellerCommission("s1", 12)

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/sellers/s1/commission",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ commissionRate: 12 }) })
    )
  })

  it("listDuePayouts — calls GET /api/v1/admin/payouts/due", async () => {
    mockApiRequest.mockResolvedValue([])

    const result = await AdminService.listDuePayouts()

    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/payouts/due")
    expect(result).toEqual([])
  })

  describe("listDuePayouts — Gebührenkette (#53)", () => {
    const rawDue = {
      sellerId: "s1",
      sellerName: "Atelier Nord",
      payoutAccountStatus: "ACTIVE",
      settlementCount: 2,
      grossAmount: 160.0,
      refundedAmount: 10.0,
      feeAmount: 22.5,
      stripeFeeAmount: 2.9,
      refundFeeAmount: 0.4,
      chargebackAmount: 15.0,
      netAmount: 109.6,
      currency: "EUR",
      oldestEligibleAt: "2026-03-22T10:00:00Z",
    }

    it("reicht die verdichteten Positionen durch", async () => {
      mockApiRequest.mockResolvedValue([rawDue])

      const [item] = await AdminService.listDuePayouts()

      expect(item).toEqual({
        sellerId: "s1",
        sellerName: "Atelier Nord",
        payoutAccountStatus: "ACTIVE",
        settlementCount: 2,
        grossAmount: 160.0,
        refundedAmount: 10.0,
        feeAmount: 22.5,
        stripeFeeAmount: 2.9,
        refundFeeAmount: 0.4,
        chargebackAmount: 15.0,
        netAmount: 109.6,
        currency: "EUR",
        oldestEligibleAt: "2026-03-22T10:00:00Z",
      })
    })

    it("hebt fehlende Währung und Fälligkeit auf undefined", async () => {
      mockApiRequest.mockResolvedValue([{ ...rawDue, currency: null, oldestEligibleAt: null }])

      const [item] = await AdminService.listDuePayouts()

      expect(item.currency).toBeUndefined()
      expect(item.oldestEligibleAt).toBeUndefined()
    })

    it("lehnt einen unbekannten Kontostatus ab, statt ihn als nicht-freigebbar zu deuten", async () => {
      mockApiRequest.mockResolvedValue([{ ...rawDue, payoutAccountStatus: "SUSPENDED" }])

      await expect(AdminService.listDuePayouts()).rejects.toThrow(/Ungültige Server-Antwort/)
    })

    it("lehnt eine Zeile ohne Stripe-Gebühr ab — vor der Freigabe darf nichts fehlen", async () => {
      const incomplete: Record<string, unknown> = { ...rawDue }
      delete incomplete.stripeFeeAmount
      mockApiRequest.mockResolvedValue([incomplete])

      await expect(AdminService.listDuePayouts()).rejects.toThrow(/Ungültige Server-Antwort/)
    })
  })

  it("runPayout — POST /api/v1/admin/payouts/run with sellerId body", async () => {
    mockApiRequest.mockResolvedValue({
      payoutId: "p1",
      sellerId: "s1",
      amount: 5000,
      status: "PENDING",
      createdAt: "",
    })

    await AdminService.runPayout("s1")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/payouts/run",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ sellerId: "s1" }) })
    )
  })

  // ── Refund escalation (#56) ──────────────────────────────────────────

  describe("createRefund", () => {
    const rawRefund = {
      refundId: "ref_1",
      paymentId: "pay_1",
      orderId: "ord_1",
      orderGroupId: "grp_1",
      sellerId: "seller_1",
      amount: 55,
      currency: "EUR",
      status: "SUCCEEDED",
      providerRefundId: "re_stripe_1",
      initiatedBy: "ADMIN",
      reason: "Eskalation: Seller reagiert nicht",
      settlementRefundedAmount: 55,
      settlementRemainingRefundableAmount: 0,
      settlementPlatformFeeAmount: 0,
      settlementRefundFeeAmount: 1.25,
      settlementNetAmount: -1.25,
      settlementAdjustmentRequired: true,
    }

    it("POSTs /api/v1/admin/refunds — same path as the read list, other method", async () => {
      mockApiRequest.mockResolvedValue(rawRefund)

      const result = await AdminService.createRefund({
        orderGroupId: "grp_1",
        reason: "Eskalation: Seller reagiert nicht",
      })

      expect(mockApiRequest).toHaveBeenCalledWith(
        "/api/v1/admin/refunds",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            orderGroupId: "grp_1",
            reason: "Eskalation: Seller reagiert nicht",
          }),
        })
      )
      expect(result.initiatedBy).toBe("ADMIN")
    })

    it("keeps a negative settlement net amount after a full refund", async () => {
      mockApiRequest.mockResolvedValue(rawRefund)

      const result = await AdminService.createRefund({ orderGroupId: "grp_1" })

      expect(result.settlementNetAmount).toBe(-1.25)
      expect(result.settlementRemainingRefundableAmount).toBe(0)
    })

    it("sends a partial amount as decimal EUR", async () => {
      mockApiRequest.mockResolvedValue({ ...rawRefund, amount: 10.5 })

      await AdminService.createRefund({ orderGroupId: "grp_1", amount: 10.5 })

      const body = mockApiRequest.mock.calls[0][1]?.body as string
      expect(JSON.parse(body)).toEqual({ orderGroupId: "grp_1", amount: 10.5 })
    })

    it("rejects an unknown initiator instead of casting it through", async () => {
      mockApiRequest.mockResolvedValue({ ...rawRefund, initiatedBy: "BUYER" })

      await expect(AdminService.createRefund({ orderGroupId: "grp_1" })).rejects.toThrow(
        /Ungültige Server-Antwort/
      )
    })
  })
})
