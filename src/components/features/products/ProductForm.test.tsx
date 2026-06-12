import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ProductForm from "./ProductForm"
import { ProductService } from "@/src/services/product.service"
import type { Material } from "@/src/types"

const materials: Material[] = [
  { id: "m-1", slug: "leinen", name: "Leinen" },
  { id: "m-2", slug: "hanf", name: "Hanf" },
]

vi.mock("@/src/hooks/useMaterials", () => ({
  useMaterials: () => ({ data: materials }),
}))
vi.mock("@/src/hooks/useFocusTrap", () => ({
  useFocusTrap: () => ({ current: null }),
}))
vi.mock("@/src/services/category.service", () => ({
  CategoryService: { list: vi.fn().mockResolvedValue([]) },
}))
vi.mock("@/src/services/product.service", () => ({
  ProductService: { create: vi.fn(), update: vi.fn(), getById: vi.fn() },
}))
vi.mock("./ProductImageManager", () => ({ default: () => null }))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

describe("ProductForm – Material", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders a chip per material and toggles selection on click", () => {
    render(<ProductForm onClose={vi.fn()} onSaved={vi.fn()} />)

    const leinen = screen.getByRole("button", { name: "Leinen", pressed: false })
    fireEvent.click(leinen)
    expect(screen.getByRole("button", { name: "Leinen" })).toHaveAttribute("aria-pressed", "true")
  })

  it("prefills assigned materials from the product detail in edit mode", async () => {
    vi.mocked(ProductService.getById).mockResolvedValue({
      id: "prod-1",
      slug: "leinenhemd",
      name: "Leinenhemd",
      materials: [{ id: "m-1", slug: "leinen", name: "Leinen" }],
    } as Awaited<ReturnType<typeof ProductService.getById>>)

    render(<ProductForm productId="prod-1" onClose={vi.fn()} onSaved={vi.fn()} />)

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Leinen" })).toHaveAttribute("aria-pressed", "true")
    )
    expect(screen.getByRole("button", { name: "Hanf" })).toHaveAttribute("aria-pressed", "false")
  })
})
