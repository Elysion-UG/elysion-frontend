import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { ApiSchemaError } from "@/src/lib/api-schemas"
import { CategoryService } from "./category.service"
import type { CategoryCreateDTO, CategoryUpdateDTO } from "@/src/types"

vi.mock("@/src/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/src/lib/api-client")>()
  return { ...actual, apiRequest: vi.fn(), apiRequestRaw: vi.fn(), apiUpload: vi.fn() }
})

const mockApiRequest = vi.mocked(apiRequest)

const ACTIVE_ITEM = {
  id: "cat_1",
  name: "Kleidung",
  slug: "kleidung",
  parentId: null,
  level: 1,
  description: null,
  order: 0,
  isActive: true,
}
const INACTIVE_ITEM = { ...ACTIVE_ITEM, id: "cat_2", name: "Altbestand", isActive: false }

const TREE_NODE = {
  id: "cat_1",
  name: "Kleidung",
  slug: "kleidung",
  level: 1,
  order: 0,
  isActive: true,
  children: [
    {
      id: "cat_2",
      name: "Altbestand",
      slug: "altbestand",
      level: 2,
      order: 1,
      isActive: false,
      children: [],
    },
  ],
}

const COMMAND_RESULT = { id: "cat_1", slug: "kleidung", level: 1, isActive: true }

describe("CategoryService", () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Paths ───────────────────────────────────────────────────────────

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

  it("adminList GETs /api/v1/admin/categories (#226)", async () => {
    mockApiRequest.mockResolvedValue([])
    await CategoryService.adminList()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/categories")
  })

  it("adminTree GETs /api/v1/admin/categories/tree (#226)", async () => {
    mockApiRequest.mockResolvedValue([])
    await CategoryService.adminTree()
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/categories/tree")
  })

  it("create POSTs the DTO to /api/v1/admin/categories", async () => {
    const dto: CategoryCreateDTO = { name: "Neu", slug: "neu", order: 0 }
    mockApiRequest.mockResolvedValue(COMMAND_RESULT)
    await CategoryService.create(dto)
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/categories", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  })

  it("create propagates a failed POST (regression guard for #178)", async () => {
    const dto: CategoryCreateDTO = { name: "Neu", slug: "neu", order: 0 }
    mockApiRequest.mockRejectedValue(new Error("Request failed (400)"))
    await expect(CategoryService.create(dto)).rejects.toThrow("Request failed (400)")
  })

  it("update PATCHes the DTO to /api/v1/admin/categories/{id}", async () => {
    const dto: CategoryUpdateDTO = { name: "Umbenannt", slug: "umbenannt", order: 0 }
    mockApiRequest.mockResolvedValue(COMMAND_RESULT)
    await CategoryService.update("cat_1", dto)
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/categories/cat_1", {
      method: "PATCH",
      body: JSON.stringify(dto),
    })
  })

  it("activate PATCHes /api/v1/admin/categories/{id}/activate", async () => {
    mockApiRequest.mockResolvedValue(null)
    await CategoryService.activate("cat_1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/categories/cat_1/activate", {
      method: "PATCH",
    })
  })

  it("deactivate PATCHes /api/v1/admin/categories/{id}/deactivate", async () => {
    mockApiRequest.mockResolvedValue(null)
    await CategoryService.deactivate("cat_1")
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/admin/categories/cat_1/deactivate", {
      method: "PATCH",
    })
  })

  // Path-only guard: it says nothing about the request *bodies*. Those are
  // pinned in AdminCategories.test.tsx, where the DTOs are actually built.
  it("routes every write to the admin prefix, never the public read controller (#178)", async () => {
    mockApiRequest.mockResolvedValue(COMMAND_RESULT)
    await CategoryService.create({ name: "Neu", slug: "neu", order: 0 })
    await CategoryService.update("cat_1", { name: "Neu", slug: "neu", order: 0 })
    await CategoryService.activate("cat_1")
    await CategoryService.deactivate("cat_1")

    for (const call of mockApiRequest.mock.calls) {
      expect(String(call[0]).startsWith("/api/v1/admin/categories")).toBe(true)
    }
  })

  it("keeps the public reads on the public prefix (#226)", async () => {
    mockApiRequest.mockResolvedValue([])
    await CategoryService.list()
    await CategoryService.tree()

    for (const call of mockApiRequest.mock.calls) {
      expect(String(call[0]).startsWith("/api/v1/categories")).toBe(true)
    }
  })

  // ── Schema validation (#226) ────────────────────────────────────────

  it("carries isActive through the flat list and nulls out to undefined", async () => {
    mockApiRequest.mockResolvedValue([ACTIVE_ITEM, INACTIVE_ITEM])

    const list = await CategoryService.adminList()

    expect(list).toEqual([
      {
        id: "cat_1",
        name: "Kleidung",
        slug: "kleidung",
        parentId: undefined,
        level: 1,
        description: undefined,
        order: 0,
        isActive: true,
      },
      expect.objectContaining({ id: "cat_2", isActive: false }),
    ])
  })

  it("carries isActive through nested tree nodes", async () => {
    mockApiRequest.mockResolvedValue([TREE_NODE])

    const tree = await CategoryService.adminTree()

    expect(tree[0].isActive).toBe(true)
    expect(tree[0].children[0].isActive).toBe(false)
  })

  it("rejects a flat list without isActive instead of silently defaulting it", async () => {
    // The exact drift this issue is about: the type declared a status field the
    // backend never sent, and nothing complained.
    const { isActive: _dropped, ...withoutFlag } = ACTIVE_ITEM
    mockApiRequest.mockResolvedValue([withoutFlag])

    await expect(CategoryService.adminList()).rejects.toBeInstanceOf(ApiSchemaError)
  })

  it("rejects a tree node without isActive", async () => {
    const { isActive: _dropped, ...withoutFlag } = TREE_NODE
    mockApiRequest.mockResolvedValue([{ ...withoutFlag, children: [] }])

    await expect(CategoryService.adminTree()).rejects.toBeInstanceOf(ApiSchemaError)
  })

  it("validates the command response shape (CategoryCommandResponse, not Category)", async () => {
    mockApiRequest.mockResolvedValue(COMMAND_RESULT)
    await expect(CategoryService.create({ name: "Neu", slug: "neu", order: 0 })).resolves.toEqual(
      COMMAND_RESULT
    )

    mockApiRequest.mockResolvedValue({ id: "cat_1", name: "Kleidung" })
    await expect(
      CategoryService.create({ name: "Neu", slug: "neu", order: 0 })
    ).rejects.toBeInstanceOf(ApiSchemaError)
  })
})
