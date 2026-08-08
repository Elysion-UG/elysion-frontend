import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { CategoryService } from "./category.service"
import type { CategoryCreateDTO, CategoryUpdateDTO } from "@/src/types"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

describe("CategoryService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("list GETs /api/v1/categories", async () => {
    mockApiRequest.mockResolvedValue([])
    await CategoryService.list()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/categories")
  })

  it("tree GETs /api/v1/categories/tree", async () => {
    mockApiRequest.mockResolvedValue([])
    await CategoryService.tree()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/categories/tree")
  })

  it("create POSTs the DTO to /api/v1/admin/categories", async () => {
    const dto: CategoryCreateDTO = { name: "Neu" } as unknown as CategoryCreateDTO
    mockApiRequest.mockResolvedValue({ id: "cat_1", name: "Neu" })
    await CategoryService.create(dto)
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/categories", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  })

  it("create propagates a failed POST (regression guard for #178)", async () => {
    const dto: CategoryCreateDTO = { name: "Neu" } as unknown as CategoryCreateDTO
    mockApiRequest.mockRejectedValue(new Error("Request failed (400)"))
    await expect(CategoryService.create(dto)).rejects.toThrow("Request failed (400)")
  })

  it("update PATCHes the DTO to /api/v1/admin/categories/{id}", async () => {
    const dto: CategoryUpdateDTO = { name: "Umbenannt" } as unknown as CategoryUpdateDTO
    mockApiRequest.mockResolvedValue({ id: "cat_1" })
    await CategoryService.update("cat_1", dto)
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/categories/cat_1", {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  })

  it("activate PATCHes /api/v1/admin/categories/{id}/activate", async () => {
    mockApiRequest.mockResolvedValue({ id: "cat_1", active: true })
    await CategoryService.activate("cat_1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/categories/cat_1/activate", {
      method: "PATCH",
    })
  })

  it("deactivate PATCHes /api/v1/admin/categories/{id}/deactivate", async () => {
    mockApiRequest.mockResolvedValue({ id: "cat_1", active: false })
    await CategoryService.deactivate("cat_1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/categories/cat_1/deactivate", {
      method: "PATCH",
    })
  })

  // Path-only guard: it says nothing about the request *bodies*. Those are
  // pinned in AdminCategories.test.tsx, where the DTOs are actually built.
  it("routes every write to the admin prefix, never the public read controller (#178)", async () => {
    mockApiRequest.mockResolvedValue({ id: "cat_1" })
    await CategoryService.create({ name: "Neu" } as unknown as CategoryCreateDTO)
    await CategoryService.update("cat_1", { name: "Neu" } as unknown as CategoryUpdateDTO)
    await CategoryService.activate("cat_1")
    await CategoryService.deactivate("cat_1")

    for (const call of mockApiRequest.mock.calls) {
      expect(String(call[0]).startsWith("/api/v1/admin/categories")).toBe(true)
    }
  })
})
