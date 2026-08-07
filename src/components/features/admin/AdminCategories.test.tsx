import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import AdminCategories from "./AdminCategories"
import { ApiError } from "@/src/lib/api-client"

/**
 * Regression coverage for #178: the create payload dropped a valid `order` of 0
 * (`Number(x) || undefined`), which the backend rejects with "order is required".
 * Also pins the failure path — a rejected save must surface the backend message
 * inline instead of silently leaving the modal open.
 */

const createMutate = vi.fn()
const updateMutate = vi.fn()

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

vi.mock("@/src/hooks/useAdminCategories", () => ({
  useAdminCategories: () => ({
    data: { tree: [], flat: [] },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useCreateCategory: () => ({ mutate: createMutate, isPending: false }),
  useUpdateCategory: () => ({ mutate: updateMutate, isPending: false }),
  useToggleCategoryStatus: () => ({ mutate: vi.fn(), isPending: false, variables: undefined }),
}))

function openCreateModal() {
  render(<AdminCategories />)
  fireEvent.click(screen.getByRole("button", { name: /Neue Kategorie/ }))
  fireEvent.change(screen.getByLabelText("Name *"), { target: { value: "Testkategorie" } })
}

describe("AdminCategories – create payload (#178)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("keeps a sort order of 0 instead of dropping it", () => {
    openCreateModal()
    fireEvent.change(screen.getByLabelText("Sortierung"), { target: { value: "0" } })
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }))

    expect(createMutate).toHaveBeenCalledTimes(1)
    expect(createMutate.mock.calls[0][0]).toMatchObject({ name: "Testkategorie", order: 0 })
  })

  it("passes a non-zero sort order through unchanged", () => {
    openCreateModal()
    fireEvent.change(screen.getByLabelText("Sortierung"), { target: { value: "7" } })
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }))

    expect(createMutate.mock.calls[0][0]).toMatchObject({ order: 7 })
  })

  it("omits the sort order only when the field is empty", () => {
    openCreateModal()
    fireEvent.change(screen.getByLabelText("Sortierung"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }))

    expect(createMutate.mock.calls[0][0].order).toBeUndefined()
  })

  it("shows the backend message inline when the save fails", () => {
    createMutate.mockImplementation((_dto, opts) => {
      opts.onError(new ApiError(400, "order is required"))
    })

    openCreateModal()
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }))

    expect(screen.getByRole("alert")).toHaveTextContent("order is required")
  })
})
