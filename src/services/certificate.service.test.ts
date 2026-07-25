import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { CertificateService } from "./certificate.service"
import type { CertificateCreateDTO, CertificateUpdateDTO } from "@/src/types"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

describe("CertificateService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiRequest.mockResolvedValue({})
  })

  describe("owner endpoints (/api/v1/certificates)", () => {
    it("create POSTs the DTO", async () => {
      const dto: CertificateCreateDTO = { type: "GOTS" } as unknown as CertificateCreateDTO
      await CertificateService.create(dto)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/certificates", {
        method: "POST",
        body: JSON.stringify(dto),
      })
    })

    it("list GETs the collection", async () => {
      await CertificateService.list()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/certificates")
    })

    it("getById GETs a single certificate", async () => {
      await CertificateService.getById("cert_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/certificates/cert_1")
    })

    it("update PATCHes the DTO", async () => {
      const dto: CertificateUpdateDTO = { issuer: "TÜV" } as unknown as CertificateUpdateDTO
      await CertificateService.update("cert_1", dto)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/certificates/cert_1", {
        method: "PATCH",
        body: JSON.stringify(dto),
      })
    })

    it("linkToProduct POSTs to the nested product path", async () => {
      await CertificateService.linkToProduct("cert_1", "prod_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/certificates/cert_1/products/prod_1", {
        method: "POST",
      })
    })

    it("unlinkFromProduct DELETEs the nested product path", async () => {
      await CertificateService.unlinkFromProduct("cert_1", "prod_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/certificates/cert_1/products/prod_1", {
        method: "DELETE",
      })
    })
  })

  describe("admin endpoints (/api/v1/admin/certificates)", () => {
    it("verify PATCHes the verify action", async () => {
      await CertificateService.verify("cert_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/certificates/cert_1/verify", {
        method: "PATCH",
      })
    })

    it("reject PATCHes with the reason in the body", async () => {
      await CertificateService.reject("cert_1", "unleserlich")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/certificates/cert_1/reject", {
        method: "PATCH",
        body: JSON.stringify({ reason: "unleserlich" }),
      })
    })

    it("adminListAll GETs the admin collection", async () => {
      await CertificateService.adminListAll()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/certificates")
    })

    it("adminGetById GETs a single admin certificate", async () => {
      await CertificateService.adminGetById("cert_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/certificates/cert_1")
    })
  })

  describe("seller endpoints (/api/v1/seller/certificates)", () => {
    it("sellerList GETs the seller collection", async () => {
      await CertificateService.sellerList()
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/certificates")
    })

    it("sellerGetById GETs a single seller certificate", async () => {
      await CertificateService.sellerGetById("cert_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/certificates/cert_1")
    })

    it("sellerCreate POSTs the DTO", async () => {
      const dto = { type: "GOTS" } as unknown as Parameters<
        typeof CertificateService.sellerCreate
      >[0]
      await CertificateService.sellerCreate(dto)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/seller/certificates", {
        method: "POST",
        body: JSON.stringify(dto),
      })
    })

    it("getProductCertificates GETs the public product certificates", async () => {
      await CertificateService.getProductCertificates("prod_1")
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/products/prod_1/certificates")
    })
  })

  it("propagates errors", async () => {
    mockApiRequest.mockRejectedValue(new Error("Not found"))
    await expect(CertificateService.getById("nope")).rejects.toThrow("Not found")
  })
})
