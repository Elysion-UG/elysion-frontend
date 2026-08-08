import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import AdminCategories from "./AdminCategories"
import { ApiError } from "@/src/lib/api-client"
import type { Category, CategoryTreeNode } from "@/src/types"

/**
 * Payload coverage for #178. Both write paths used to send bodies the backend
 * rejects outright:
 *   - create dropped a valid `order` of 0 (`Number(x) || undefined`)
 *   - update omitted `slug` (`@NotBlank`) and `parentId` — the latter makes
 *     CategoryCommandService.resolveParent() fall back to root/level 1, which
 *     silently unnests the edited sub-category
 * These tests pin the full body of both requests, not just the endpoint.
 */

const createMutate = vi.fn()
const updateMutate = vi.fn()

// A level-2 child under a level-1 root — the shape that regresses to root when
// parentId is left out of the PATCH body.
const CHILD: CategoryTreeNode = {
  id: "child-1",
  name: "T-Shirts",
  slug: "t-shirts",
  level: 2,
  order: 3,
  children: [],
}
const ROOT: CategoryTreeNode = {
  id: "root-1",
  name: "Kleidung",
  slug: "kleidung",
  level: 1,
  order: 0,
  children: [CHILD],
}
const FLAT: Category[] = [
  { id: "root-1", name: "Kleidung", slug: "kleidung", level: 1, order: 0, status: "ACTIVE" },
  {
    id: "child-1",
    name: "T-Shirts",
    slug: "t-shirts",
    parentId: "root-1",
    level: 2,
    order: 3,
    description: "Shirts und Tops",
    status: "ACTIVE",
  },
]

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

vi.mock("@/src/hooks/useAdminCategories", () => ({
  useAdminCategories: () => ({
    data: { tree: [ROOT], flat: FLAT },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useCreateCategory: () => ({ mutate: createMutate, isPending: false }),
  useUpdateCategory: () => ({ mutate: updateMutate, isPending: false }),
  useToggleCategoryStatus: () => ({ mutate: vi.fn(), isPending: false, variables: undefined }),
}))

const setOrder = (value: string) =>
  fireEvent.change(screen.getByLabelText("Sortierung"), { target: { value } })
const save = () => fireEvent.click(screen.getByRole("button", { name: "Speichern" }))

/** Opens the create modal with a valid name filled in. */
function openCreateModal() {
  render(<AdminCategories />)
  fireEvent.click(screen.getByRole("button", { name: /Neue Kategorie/ }))
  fireEvent.change(screen.getByLabelText("Name *"), { target: { value: "Testkategorie" } })
}

/** Opens the edit modal on the level-2 child, leaving all fields untouched. */
function openEditModalOnChild() {
  render(<AdminCategories />)
  // Both rows expose a "Bearbeiten" action; the child is the second one.
  fireEvent.click(screen.getAllByRole("button", { name: "Bearbeiten" })[1])
}

describe("AdminCategories – create payload (#178)", () => {
  // resetAllMocks (not clearAllMocks) also drops implementations set by an
  // earlier test, so the suite survives --sequence.shuffle.
  beforeEach(() => vi.resetAllMocks())

  it("keeps a sort order of 0 instead of dropping it", () => {
    openCreateModal()
    setOrder("0")
    save()

    expect(createMutate).toHaveBeenCalledTimes(1)
    expect(createMutate.mock.calls[0][0]).toMatchObject({ name: "Testkategorie", order: 0 })
  })

  it("passes a non-zero sort order through unchanged", () => {
    openCreateModal()
    setOrder("7")
    save()

    expect(createMutate.mock.calls[0][0]).toMatchObject({ order: 7 })
  })

  it("defaults an empty sort order to 0 — never omits it", () => {
    // order is INTEGER NOT NULL DEFAULT 0; omitting it triggers the very
    // "order is required" 400 this issue is about.
    openCreateModal()
    setOrder("")
    save()

    expect(createMutate.mock.calls[0][0].order).toBe(0)
  })

  it("always sends a slug, even when the field was cleared", () => {
    openCreateModal()
    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "" } })
    save()

    expect(createMutate.mock.calls[0][0].slug).toBe("testkategorie")
  })
})

describe("AdminCategories – update payload (#178)", () => {
  beforeEach(() => vi.resetAllMocks())

  it("sends slug and parentId so the category keeps its place in the tree", () => {
    openEditModalOnChild()
    save()

    expect(updateMutate).toHaveBeenCalledTimes(1)
    const [{ id, dto }] = updateMutate.mock.calls[0]
    expect(id).toBe("child-1")
    expect(dto).toEqual({
      name: "T-Shirts",
      slug: "t-shirts",
      parentId: "root-1",
      description: "Shirts und Tops",
      order: 3,
    })
  })

  it("never sends isActive — the backend rejects lifecycle changes here", () => {
    openEditModalOnChild()
    save()

    expect(updateMutate.mock.calls[0][0].dto).not.toHaveProperty("isActive")
  })

  it("keeps a sort order of 0 and defaults an empty field to 0", () => {
    openEditModalOnChild()
    setOrder("0")
    save()
    expect(updateMutate.mock.calls[0][0].dto.order).toBe(0)

    setOrder("")
    save()
    expect(updateMutate.mock.calls[1][0].dto.order).toBe(0)
  })

  it("omits parentId for a root category so it stays at level 1", () => {
    render(<AdminCategories />)
    fireEvent.click(screen.getAllByRole("button", { name: "Bearbeiten" })[0])
    save()

    expect(updateMutate.mock.calls[0][0].dto.parentId).toBeUndefined()
  })
})

describe("AdminCategories – client-side order validation (#178)", () => {
  beforeEach(() => vi.resetAllMocks())

  // Pure garbage ("abc") cannot be tested here — an <input type="number"> drops
  // it and reports "", which legitimately means "no order". Negative and decimal
  // values, however, the field happily accepts and only the backend rejects.
  it.each([
    ["a negative order", "-3"],
    ["a decimal order", "1.5"],
  ])("rejects %s without calling the API", (_label, value) => {
    openCreateModal()
    setOrder(value)
    save()

    expect(createMutate).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent(/ganze Zahl/)
  })

  it("blocks an invalid order on the update path too", () => {
    openEditModalOnChild()
    setOrder("-1")
    save()

    expect(updateMutate).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent(/ganze Zahl/)
  })
})

describe("AdminCategories – save failure", () => {
  beforeEach(() => vi.resetAllMocks())

  it("shows the backend message inline when the save fails", () => {
    createMutate.mockImplementation((_dto, opts) => {
      opts.onError(new ApiError(400, "order is required"))
    })

    openCreateModal()
    save()

    expect(screen.getByRole("alert")).toHaveTextContent("order is required")
  })
})
