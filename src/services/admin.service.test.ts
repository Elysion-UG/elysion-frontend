import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { AdminService } from "./admin.service"
import type { PagedResponse, AdminUserListItem } from "@/src/types"

vi.mock("@/src/lib/api-client", () => ({
  apiRequest: vi.fn(),
}))

const mockApiRequest = vi.mocked(apiRequest)

const mockPagedResponse = <T>(items: T[]): PagedResponse<T> => ({
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

    // page is zero-indexed: page 1 → page=0 in query
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/users?page=0&size=10&search=alice&role=BUYER&status=ACTIVE"
    )
  })

  it("listUsers — omits absent params", async () => {
    mockApiRequest.mockResolvedValue(mockPagedResponse([]))

    await AdminService.listUsers({ page: 1 })

    // page 1 → page=0
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/users?page=0")
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
})
