import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AdminListPage } from "./AdminListPage"
import { TableCell } from "@/src/components/ui/table"

interface Row {
  id: string
  name: string
}

const ROWS: Row[] = [
  { id: "1", name: "Alpha" },
  { id: "2", name: "Beta" },
]

function renderList(overrides: Partial<React.ComponentProps<typeof AdminListPage<Row>>> = {}) {
  return render(
    <AdminListPage<Row>
      title="Test-Liste"
      columns={[{ header: "Name" }, { header: "Aktion", className: "text-right" }]}
      rows={ROWS}
      isLoading={false}
      emptyMessage="Nichts gefunden."
      getRowKey={(r) => r.id}
      renderRow={(r) => (
        <>
          <TableCell>{r.name}</TableCell>
          <TableCell>–</TableCell>
        </>
      )}
      page={0}
      totalPages={1}
      onPageChange={vi.fn()}
      {...overrides}
    />
  )
}

describe("AdminListPage", () => {
  it("renders title, column headers and rows", () => {
    renderList()

    expect(screen.getByRole("heading", { name: "Test-Liste" })).toBeInTheDocument()
    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Aktion")).toBeInTheDocument()
    expect(screen.getByText("Alpha")).toBeInTheDocument()
    expect(screen.getByText("Beta")).toBeInTheDocument()
  })

  it("shows the empty message when there are no rows", () => {
    renderList({ rows: [] })
    expect(screen.getByText("Nichts gefunden.")).toBeInTheDocument()
  })

  it("does not render rows while loading", () => {
    renderList({ isLoading: true })
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument()
  })

  it("renders the filter bar only when filters are provided", () => {
    const { rerender } = renderList()
    expect(screen.queryByPlaceholderText("Suche")).not.toBeInTheDocument()

    rerender(
      <AdminListPage<Row>
        title="Test-Liste"
        filters={<input placeholder="Suche" />}
        columns={[{ header: "Name" }]}
        rows={ROWS}
        isLoading={false}
        emptyMessage="Nichts gefunden."
        getRowKey={(r) => r.id}
        renderRow={(r) => <TableCell>{r.name}</TableCell>}
        page={0}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText("Suche")).toBeInTheDocument()
  })

  it("fires onRowClick with the clicked row", () => {
    const onRowClick = vi.fn()
    renderList({ onRowClick })

    fireEvent.click(screen.getByText("Alpha"))
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0])
  })

  it("hides the pager for a single page and converts 0-based to 1-based", () => {
    const { rerender } = renderList({ totalPages: 1 })
    expect(screen.queryByText(/Seite/)).not.toBeInTheDocument()

    const onPageChange = vi.fn()
    rerender(
      <AdminListPage<Row>
        title="Test-Liste"
        columns={[{ header: "Name" }]}
        rows={ROWS}
        isLoading={false}
        emptyMessage="Nichts gefunden."
        getRowKey={(r) => r.id}
        renderRow={(r) => <TableCell>{r.name}</TableCell>}
        page={0}
        totalPages={3}
        onPageChange={onPageChange}
      />
    )

    // 0-based page 0 displays as "Seite 1 von 3"
    expect(screen.getByText("Seite 1 von 3")).toBeInTheDocument()

    // Clicking next (1-based 2) reports back the 0-based page 1
    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[buttons.length - 1])
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it("renders extra children (e.g. modals) after the table", () => {
    renderList({ children: <div data-testid="modal">modal</div> })
    expect(screen.getByTestId("modal")).toBeInTheDocument()
  })
})
