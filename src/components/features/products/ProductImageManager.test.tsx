import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ProductImageManager from "./ProductImageManager"
import { ProductService } from "@/src/services/product.service"
import { FileService } from "@/src/services/file.service"

vi.mock("@/src/services/product.service", () => ({
  ProductService: {
    getById: vi.fn(),
    addImage: vi.fn(),
    deleteImage: vi.fn(),
    reorderImages: vi.fn(),
  },
}))
vi.mock("@/src/services/file.service", () => ({
  FileService: { upload: vi.fn() },
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

describe("ProductImageManager", () => {
  beforeEach(() => vi.clearAllMocks())

  // Der Kern von #234: Die Komponente hat das Produkt über
  // GET /api/v1/products/by-id/{id} nachgeladen, um an `images` zu kommen — ein
  // Feld, das dieser DTO nicht führt. Ein Request pro Mount ohne jeden Effekt,
  // zusätzlich zu dem, den ProductForm für die Materialien ohnehin schon macht.
  it("lädt beim Mount nichts nach — die Route führt keine Bilder (#234)", () => {
    render(<ProductImageManager productId="prod-1" initialImages={[]} />)

    expect(ProductService.getById).not.toHaveBeenCalled()
  })

  it("sagt im Leerzustand offen, dass vorhandene Bilder nicht gelistet werden", () => {
    render(<ProductImageManager productId="prod-1" initialImages={[]} />)

    expect(screen.getByText(/Noch keine Bilder in dieser Sitzung/)).toBeInTheDocument()
    expect(screen.getByText(/werden hier derzeit nicht angezeigt/)).toBeInTheDocument()
  })

  it("zeigt übergebene initialImages", () => {
    render(
      <ProductImageManager
        productId="prod-1"
        initialImages={[{ id: "img-1", url: "https://example.test/a.jpg", position: 0 }]}
      />
    )

    expect(screen.getByAltText("Produktbild 1")).toBeInTheDocument()
    expect(screen.queryByText(/Noch keine Bilder in dieser Sitzung/)).not.toBeInTheDocument()
  })

  it("hängt ein hochgeladenes Bild an die Liste an", async () => {
    vi.mocked(FileService.upload).mockResolvedValue({
      fileId: "file-1",
      url: "https://example.test/neu.jpg",
    } as Awaited<ReturnType<typeof FileService.upload>>)
    vi.mocked(ProductService.addImage).mockResolvedValue(null)

    const { container } = render(<ProductImageManager productId="prod-1" initialImages={[]} />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File(["x"], "neu.jpg", { type: "image/jpeg" })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByAltText("Produktbild 1")).toBeInTheDocument())
    expect(ProductService.addImage).toHaveBeenCalledWith("prod-1", { fileId: "file-1", order: 0 })
  })
})
