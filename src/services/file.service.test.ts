import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest, apiUpload, API_BASE } from "@/src/lib/api-client"
import { FileService } from "./file.service"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)
const mockApiUpload = vi.mocked(apiUpload)

function makeFile(name = "cert.pdf") {
  return new File(["dummy"], name, { type: "application/pdf" })
}

describe("FileService", () => {
  beforeEach(() => vi.clearAllMocks())

  describe("upload", () => {
    it("uploads via multipart to /api/v1/files/upload with file + category", async () => {
      mockApiUpload.mockResolvedValue({ fileId: "f_1" })
      await FileService.upload(makeFile(), "CERTIFICATE" as never)
      expect(mockApiUpload).toHaveBeenCalledTimes(1)
      const [path, form] = mockApiUpload.mock.calls[0]
      expect(path).toBe("/api/v1/files/upload")
      expect(form).toBeInstanceOf(FormData)
      expect((form as FormData).get("category")).toBe("CERTIFICATE")
      expect((form as FormData).get("file")).toBeInstanceOf(File)
    })

    it("appends relatedEntityType/Id only when provided", async () => {
      mockApiUpload.mockResolvedValue({ fileId: "f_1" })
      await FileService.upload(makeFile(), "CERTIFICATE" as never, "PRODUCT" as never, "prod_1")
      const form = mockApiUpload.mock.calls[0][1] as FormData
      expect(form.get("relatedEntityType")).toBe("PRODUCT")
      expect(form.get("relatedEntityId")).toBe("prod_1")
    })
  })

  it("getMetadata GETs /api/v1/files/{id}", async () => {
    mockApiRequest.mockResolvedValue({ fileId: "f_1" })
    await FileService.getMetadata("f_1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/files/f_1")
  })

  it("getContentUrl builds a same-origin content URL without a request", () => {
    expect(FileService.getContentUrl("f_1")).toBe(`${API_BASE}/api/v1/files/f_1/content`)
    expect(mockApiRequest).not.toHaveBeenCalled()
  })

  it("delete DELETEs /api/v1/files/{id}", async () => {
    mockApiRequest.mockResolvedValue(null)
    await FileService.delete("f_1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/files/f_1", { method: "DELETE" })
  })

  it("link POSTs the target to /link", async () => {
    mockApiRequest.mockResolvedValue(null)
    await FileService.link("f_1", "PRODUCT" as never, "prod_1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/files/f_1/link", {
      method: "POST",
      body: JSON.stringify({ target: "PRODUCT", targetId: "prod_1" }),
    })
  })

  it("unlink POSTs the target to /unlink", async () => {
    mockApiRequest.mockResolvedValue(null)
    await FileService.unlink("f_1", "PRODUCT" as never, "prod_1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/files/f_1/unlink", {
      method: "POST",
      body: JSON.stringify({ target: "PRODUCT", targetId: "prod_1" }),
    })
  })

  it("replace POSTs the new file reference to /replace", async () => {
    mockApiRequest.mockResolvedValue({ fileId: "f_2" })
    await FileService.replace("f_1", "f_2", "PRODUCT" as never, "prod_1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/files/f_1/replace", {
      method: "POST",
      body: JSON.stringify({ newFileId: "f_2", targetType: "PRODUCT", targetId: "prod_1" }),
    })
  })

  describe("uploadAndLink", () => {
    it("uploads then links the returned fileId", async () => {
      mockApiUpload.mockResolvedValue({ fileId: "f_9" })
      mockApiRequest.mockResolvedValue(null)
      await FileService.uploadAndLink(
        makeFile(),
        "CERTIFICATE" as never,
        "PRODUCT" as never,
        "prod_1"
      )
      expect(mockApiUpload).toHaveBeenCalledTimes(1)
      expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/files/f_9/link", {
        method: "POST",
        body: JSON.stringify({ target: "PRODUCT", targetId: "prod_1" }),
      })
    })
  })
})
