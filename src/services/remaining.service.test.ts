/**
 * Tests for all remaining services:
 * BuyerValueProfileService, CartService, CategoryService, CertificateService,
 * CheckoutService, FileService, PaymentService, RecommendationService,
 * SellerOrderService, SellerProfileService, SellerValueProfileService
 */
import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest, apiUpload } from "@/src/lib/api-client"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)
const mockApiUpload = vi.mocked(apiUpload)

beforeEach(() => vi.clearAllMocks())

// ── BuyerValueProfileService ──────────────────────────────────────────────────
import { BuyerValueProfileService } from "./buyer-value-profile.service"

describe("BuyerValueProfileService", () => {
  it("get calls correct endpoint and maps profile type to lowercase", async () => {
    mockApiRequest.mockResolvedValue({
      id: "1",
      userId: "u1",
      activeProfileType: "SIMPLE",
      simpleProfile: '{"eco":80}',
      extendedProfile: null,
      updatedAt: "2024-01-01",
    })
    const result = await BuyerValueProfileService.get()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me/profile")
    expect(result.activeProfileType).toBe("simple")
    expect(result.simpleProfile).toEqual({ eco: 80 })
  })

  it("get handles null profiles", async () => {
    mockApiRequest.mockResolvedValue({
      id: "1",
      userId: "u1",
      activeProfileType: "NONE",
      simpleProfile: null,
      extendedProfile: null,
      updatedAt: "2024-01-01",
    })
    const result = await BuyerValueProfileService.get()
    expect(result.activeProfileType).toBe("none")
    expect(result.simpleProfile).toBeNull()
  })

  it("get parses extendedProfile JSON string", async () => {
    mockApiRequest.mockResolvedValue({
      id: "1",
      userId: "u1",
      activeProfileType: "EXTENDED",
      simpleProfile: null,
      extendedProfile: '{"eco":{"climate":90}}',
      updatedAt: "2024-01-01",
    })
    const result = await BuyerValueProfileService.get()
    expect(result.activeProfileType).toBe("extended")
    expect(result.extendedProfile).toEqual({ eco: { climate: 90 } })
  })

  it("upsert maps profile type to uppercase and serializes profiles", async () => {
    const raw = {
      id: "1",
      userId: "u1",
      activeProfileType: "SIMPLE",
      simpleProfile: '{"eco":80}',
      extendedProfile: null,
      updatedAt: "2024-01-01",
    }
    mockApiRequest.mockResolvedValue(raw)
    await BuyerValueProfileService.upsert({
      activeProfileType: "simple",
      simpleProfile: { eco: 80 },
    })
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/me/profile",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          activeProfileType: "SIMPLE",
          simpleProfile: JSON.stringify({ eco: 80 }),
          extendedProfile: null,
        }),
      })
    )
  })

  it("upsert passes null profiles as null", async () => {
    mockApiRequest.mockResolvedValue({
      id: "1",
      userId: "u1",
      activeProfileType: "NONE",
      simpleProfile: null,
      extendedProfile: null,
      updatedAt: "2024-01-01",
    })
    await BuyerValueProfileService.upsert({ activeProfileType: "none" })
    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body)
    expect(body.simpleProfile).toBeNull()
    expect(body.extendedProfile).toBeNull()
  })
})

// ── CartService ───────────────────────────────────────────────────────────────
import { CartService } from "./cart.service"

describe("CartService", () => {
  it("get calls GET /api/v1/cart", async () => {
    mockApiRequest.mockResolvedValue({ items: [] })
    await CartService.get()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/cart")
  })

  it("addItem calls POST /api/v1/cart/items", async () => {
    mockApiRequest.mockResolvedValue({ items: [] })
    const dto = { productId: "p1", variantId: "v1", quantity: 2 }
    await CartService.addItem(dto)
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/cart/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ quantity: 2, variantId: "v1" }),
      })
    )
  })

  it("updateItem calls PATCH with itemId", async () => {
    mockApiRequest.mockResolvedValue({ items: [] })
    await CartService.updateItem("item1", { quantity: 3 })
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/cart/items/item1",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("removeItem calls DELETE with itemId", async () => {
    mockApiRequest.mockResolvedValue(null)
    await CartService.removeItem("item1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/cart/items/item1",
      expect.objectContaining({ method: "DELETE" })
    )
  })
})

// ── CategoryService ───────────────────────────────────────────────────────────
import { CategoryService } from "./category.service"

describe("CategoryService", () => {
  it("list calls GET /api/v1/categories", async () => {
    mockApiRequest.mockResolvedValue([])
    await CategoryService.list()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/categories")
  })

  it("tree calls GET /api/v1/categories/tree", async () => {
    mockApiRequest.mockResolvedValue([])
    await CategoryService.tree()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/categories/tree")
  })

  it("create calls POST /api/v1/categories", async () => {
    mockApiRequest.mockResolvedValue({ id: "c1" })
    const dto = { name: "Kleidung" }
    await CategoryService.create(dto)
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/categories",
      expect.objectContaining({ method: "POST", body: JSON.stringify(dto) })
    )
  })

  it("update calls PATCH with category id", async () => {
    mockApiRequest.mockResolvedValue({ id: "c1" })
    await CategoryService.update("c1", { name: "Neu" })
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/categories/c1",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("activate calls PATCH on activate endpoint", async () => {
    mockApiRequest.mockResolvedValue({ id: "c1" })
    await CategoryService.activate("c1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/categories/c1/activate",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("deactivate calls PATCH on deactivate endpoint", async () => {
    mockApiRequest.mockResolvedValue({ id: "c1" })
    await CategoryService.deactivate("c1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/categories/c1/deactivate",
      expect.objectContaining({ method: "PATCH" })
    )
  })
})

// ── CertificateService ────────────────────────────────────────────────────────
import { CertificateService } from "./certificate.service"

describe("CertificateService", () => {
  it("create calls POST /api/v1/certificates", async () => {
    mockApiRequest.mockResolvedValue({ id: "cert1" })
    await CertificateService.create({ title: "Bio" })
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/certificates",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("list calls GET /api/v1/certificates", async () => {
    mockApiRequest.mockResolvedValue([])
    await CertificateService.list()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/certificates")
  })

  it("getById calls GET /api/v1/certificates/:id", async () => {
    mockApiRequest.mockResolvedValue({ id: "cert1" })
    await CertificateService.getById("cert1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/certificates/cert1")
  })

  it("update calls PATCH /api/v1/certificates/:id", async () => {
    mockApiRequest.mockResolvedValue({ id: "cert1" })
    await CertificateService.update("cert1", { title: "Updated" })
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/certificates/cert1",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("linkToProduct calls POST with certId and productId", async () => {
    mockApiRequest.mockResolvedValue({ certificateId: "c1", productId: "p1" })
    await CertificateService.linkToProduct("c1", "p1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/certificates/c1/products/p1",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("unlinkFromProduct calls DELETE", async () => {
    mockApiRequest.mockResolvedValue(null)
    await CertificateService.unlinkFromProduct("c1", "p1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/certificates/c1/products/p1",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("verify calls PATCH on admin endpoint", async () => {
    mockApiRequest.mockResolvedValue({ id: "c1", status: "VERIFIED", updatedAt: "" })
    await CertificateService.verify("c1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/certificates/c1/verify",
      expect.objectContaining({ method: "PATCH" })
    )
  })

  it("reject calls PATCH with reason", async () => {
    mockApiRequest.mockResolvedValue({ id: "c1", status: "REJECTED", updatedAt: "" })
    await CertificateService.reject("c1", "Invalid")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/admin/certificates/c1/reject",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ reason: "Invalid" }),
      })
    )
  })

  it("getProductCertificates calls correct endpoint", async () => {
    mockApiRequest.mockResolvedValue([])
    await CertificateService.getProductCertificates("p1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/products/p1/certificates")
  })

  it("adminListAll calls admin certificates endpoint", async () => {
    mockApiRequest.mockResolvedValue([])
    await CertificateService.adminListAll()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/certificates")
  })
})

// ── CheckoutService ───────────────────────────────────────────────────────────
import { CheckoutService } from "./checkout.service"

describe("CheckoutService", () => {
  const dto = { shippingAddressId: "addr1", paymentMethod: "STRIPE" as const }

  it("preview calls POST /api/v1/checkout", async () => {
    mockApiRequest.mockResolvedValue({ items: [] })
    await CheckoutService.preview(dto)
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/checkout",
      expect.objectContaining({ method: "POST", body: JSON.stringify(dto) })
    )
  })

  it("complete calls POST /api/v1/checkout/complete", async () => {
    mockApiRequest.mockResolvedValue({ orderId: "o1" })
    await CheckoutService.complete(dto)
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/checkout/complete",
      expect.objectContaining({ method: "POST", body: JSON.stringify(dto) })
    )
  })
})

// ── FileService ───────────────────────────────────────────────────────────────
import { FileService } from "./file.service"

describe("FileService", () => {
  it("upload calls apiUpload with FormData", async () => {
    mockApiUpload.mockResolvedValue({
      fileId: "f1",
      url: "http://x",
      contentType: "image/jpeg",
      sizeBytes: 100,
    })
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
    await FileService.upload(file, "PRODUCT_IMAGE")
    expect(mockApiUpload).toHaveBeenCalledWith("/api/v1/files/upload", expect.any(FormData))
  })

  it("upload appends relatedEntityType and relatedEntityId when provided", async () => {
    mockApiUpload.mockResolvedValue({
      fileId: "f1",
      url: "http://x",
      contentType: "image/jpeg",
      sizeBytes: 100,
    })
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
    await FileService.upload(file, "PRODUCT_IMAGE", "PRODUCT", "p1")
    const form = mockApiUpload.mock.calls[0][1] as FormData
    expect(form.get("relatedEntityType")).toBe("PRODUCT")
    expect(form.get("relatedEntityId")).toBe("p1")
  })

  it("getMetadata calls GET /api/v1/files/:fileId", async () => {
    mockApiRequest.mockResolvedValue({ fileId: "f1" })
    await FileService.getMetadata("f1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/files/f1")
  })

  it("getContentUrl returns correct URL", () => {
    const url = FileService.getContentUrl("f1")
    expect(url).toContain("/api/v1/files/f1/content")
  })

  it("delete calls DELETE /api/v1/files/:fileId", async () => {
    mockApiRequest.mockResolvedValue(null)
    await FileService.delete("f1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/files/f1",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("link calls POST /api/v1/files/:fileId/link", async () => {
    mockApiRequest.mockResolvedValue(null)
    await FileService.link("f1", "PRODUCT", "p1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/files/f1/link",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("unlink calls POST /api/v1/files/:fileId/unlink", async () => {
    mockApiRequest.mockResolvedValue(null)
    await FileService.unlink("f1", "PRODUCT", "p1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/files/f1/unlink",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("uploadAndLink uploads then links", async () => {
    mockApiUpload.mockResolvedValue({
      fileId: "f1",
      url: "http://x",
      contentType: "image/jpeg",
      sizeBytes: 100,
    })
    mockApiRequest.mockResolvedValue(null)
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" })
    const result = await FileService.uploadAndLink(file, "PRODUCT_IMAGE", "PRODUCT", "p1")
    expect(result.fileId).toBe("f1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/files/f1/link",
      expect.objectContaining({ method: "POST" })
    )
  })
})

// ── PaymentService ────────────────────────────────────────────────────────────
import { PaymentService } from "./payment.service"

describe("PaymentService", () => {
  it("createIntent calls POST /api/v1/payments/create-intent", async () => {
    mockApiRequest.mockResolvedValue({
      id: "pi_1",
      clientSecret: "sec",
      amount: 100,
      currency: "eur",
      status: "created",
    })
    await PaymentService.createIntent({ orderId: "o1", provider: "STRIPE" })
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/payments/create-intent",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("getStatus calls GET /api/v1/payments/:paymentId", async () => {
    mockApiRequest.mockResolvedValue({
      paymentId: "p1",
      status: "SUCCEEDED",
      amount: 100,
      updatedAt: "",
    })
    await PaymentService.getStatus("p1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/payments/p1")
  })
})

// ── RecommendationService ─────────────────────────────────────────────────────
import { RecommendationService } from "./recommendation.service"

describe("RecommendationService", () => {
  it("getRecommendations calls correct endpoint with default limit", async () => {
    mockApiRequest.mockResolvedValue([])
    await RecommendationService.getRecommendations()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/recommendations?limit=6")
  })

  it("getRecommendations uses custom limit", async () => {
    mockApiRequest.mockResolvedValue([])
    await RecommendationService.getRecommendations(3)
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/recommendations?limit=3")
  })
})

// ── SellerOrderService ────────────────────────────────────────────────────────
import { SellerOrderService } from "./seller-order.service"

describe("SellerOrderService", () => {
  it("list calls GET /api/v1/seller/orders with no params", async () => {
    mockApiRequest.mockResolvedValue({
      items: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
    })
    await SellerOrderService.list()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/orders")
  })

  it("list includes query params when provided", async () => {
    mockApiRequest.mockResolvedValue({ items: [] })
    await SellerOrderService.list({ page: 1, size: 10, status: "SHIPPED" })
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/seller/orders?page=1&size=10&status=SHIPPED"
    )
  })

  it("getById calls correct endpoint", async () => {
    mockApiRequest.mockResolvedValue({ id: "og1" })
    await SellerOrderService.getById("og1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/orders/og1")
  })

  it("updateStatus calls PATCH with status", async () => {
    mockApiRequest.mockResolvedValue({ id: "og1" })
    await SellerOrderService.updateStatus("og1", "CONFIRMED")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/seller/orders/og1/status",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "CONFIRMED" }) })
    )
  })

  it("ship calls POST with tracking info", async () => {
    mockApiRequest.mockResolvedValue({ id: "og1" })
    await SellerOrderService.ship("og1", { trackingNumber: "TRK123", carrier: "DHL" })
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/seller/orders/og1/ship",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("deliver calls POST deliver endpoint", async () => {
    mockApiRequest.mockResolvedValue({ id: "og1" })
    await SellerOrderService.deliver("og1")
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/seller/orders/og1/deliver",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("listSettlements calls correct endpoint", async () => {
    mockApiRequest.mockResolvedValue([])
    await SellerOrderService.listSettlements()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/settlements")
  })
})

// ── SellerProfileService ──────────────────────────────────────────────────────
import { SellerProfileService } from "./seller-profile.service"

describe("SellerProfileService", () => {
  it("get calls GET /api/v1/users/me/seller-profile", async () => {
    mockApiRequest.mockResolvedValue({ id: "sp1" })
    await SellerProfileService.get()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me/seller-profile")
  })

  it("update calls PATCH with dto", async () => {
    mockApiRequest.mockResolvedValue({ id: "sp1" })
    const dto = { companyName: "GreenCo" }
    await SellerProfileService.update(dto)
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/me/seller-profile",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(dto) })
    )
  })
})

// ── SellerValueProfileService ─────────────────────────────────────────────────
import { SellerValueProfileService } from "./seller-value-profile.service"

describe("SellerValueProfileService", () => {
  it("get calls GET /api/v1/users/me/seller/value-profile", async () => {
    mockApiRequest.mockResolvedValue({ id: "svp1" })
    await SellerValueProfileService.get()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/users/me/seller/value-profile")
  })

  it("upsert calls PUT with dto", async () => {
    mockApiRequest.mockResolvedValue({ id: "svp1" })
    const dto = { level: "LEVEL_2" as const }
    await SellerValueProfileService.upsert(dto)
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/me/seller/value-profile",
      expect.objectContaining({ method: "PUT", body: JSON.stringify(dto) })
    )
  })
})
