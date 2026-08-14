import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import AdminOrderDuplicates from "./AdminOrderDuplicates"
import type { OrderDuplicateFlag, OrderDuplicateOrderRef } from "@/src/types"

/**
 * Deckt die Entscheidungslogik an der Oberfläche ab (#59): offene Fälle sind
 * entscheidbar, entschiedene nicht, und die Vertragsgrenze („protokolliert
 * nur") ist sichtbar — sie ist der Grund, warum es hier keinen Storno-Button
 * gibt.
 */

const orderRef = (overrides: Partial<OrderDuplicateOrderRef> = {}): OrderDuplicateOrderRef => ({
  id: "11111111-2222-3333-4444-555555555555",
  orderNumber: "ORD-1001",
  userId: null,
  guestEmail: "kundin@example.com",
  status: "CONFIRMED",
  paymentStatus: "SUCCEEDED",
  total: 129.9,
  currency: "EUR",
  ...overrides,
})

const OPEN_FLAG: OrderDuplicateFlag = {
  id: "flag-open",
  status: "OPEN",
  matchSignature: "a".repeat(64),
  secondsApart: 45,
  detectedAt: "2026-03-23T04:15:00Z",
  resolution: null,
  resolutionNote: null,
  resolvedBy: null,
  resolvedAt: null,
  order: orderRef({ id: "order-late", orderNumber: "ORD-1002" }),
  duplicateOf: orderRef({ id: "order-early" }),
}

const DECIDED_FLAG: OrderDuplicateFlag = {
  ...OPEN_FLAG,
  id: "flag-decided",
  status: "RESOLVED",
  resolution: "RELEASED",
  resolutionNote: "Kundin wollte wirklich zweimal bestellen",
  // Konto des Entscheiders gelöscht → resolvedBy null. Darf den Fall nicht
  // wieder als offen erscheinen lassen.
  resolvedBy: null,
  resolvedAt: "2026-03-23T09:00:00Z",
}

const mutate = vi.fn()
let flags: OrderDuplicateFlag[] = [OPEN_FLAG]

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

vi.mock("@/src/hooks/useAdminOrderDuplicates", () => ({
  useOrderDuplicates: () => ({
    data: { items: flags, page: 0, size: 25, totalItems: flags.length, totalPages: 1 },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useOrderDuplicateStats: () => ({
    data: { total: 4, open: 1, resolved: 3 },
    refetch: vi.fn(),
  }),
  useResolveOrderDuplicate: () => ({ mutate, isPending: false }),
}))

const openDialog = (orderNumbers: string) =>
  fireEvent.click(screen.getByText(orderNumbers).closest("tr")!)

describe("AdminOrderDuplicates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    flags = [OPEN_FLAG]
  })

  it("zeigt Kacheln, Vertragsgrenze und die geflaggten Paare", () => {
    render(<AdminOrderDuplicates />)

    expect(screen.getByText("Diese Ansicht protokolliert nur.")).toBeInTheDocument()
    expect(screen.getByText("ORD-1001 → ORD-1002")).toBeInTheDocument()
    expect(screen.getByText("kundin@example.com")).toBeInTheDocument()
    expect(screen.getByText("45 Sek.")).toBeInTheDocument()
  })

  it("sendet die Entscheidung mit getrimmter Begründung", () => {
    render(<AdminOrderDuplicates />)
    openDialog("ORD-1001 → ORD-1002")

    fireEvent.click(screen.getByRole("radio", { name: /Freigegeben/ }))
    fireEvent.change(screen.getByLabelText("Begründung (optional)"), {
      target: { value: "  Echtbestellung  " },
    })
    fireEvent.click(screen.getByRole("button", { name: /Entscheidung vermerken/ }))

    expect(mutate).toHaveBeenCalledWith({
      id: "flag-open",
      resolution: "RELEASED",
      note: "Echtbestellung",
    })
  })

  it("verweigert das Absenden ohne ausgewählte Entscheidung", () => {
    render(<AdminOrderDuplicates />)
    openDialog("ORD-1001 → ORD-1002")

    fireEvent.click(screen.getByRole("button", { name: /Entscheidung vermerken/ }))

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByText("Bitte eine Entscheidung auswählen.")).toBeInTheDocument()
  })

  it("weist bei Storno+Erstattung auf den fehlenden Storno-Endpoint hin", () => {
    render(<AdminOrderDuplicates />)
    openDialog("ORD-1001 → ORD-1002")

    fireEvent.click(screen.getByRole("radio", { name: /Storniert & erstattet/ }))

    // Der Hinweis steht sowohl im Seitenbanner als auch — hier geprüft — direkt
    // an der Auswahl, die man für einen Storno-Button halten könnte.
    expect(within(screen.getByRole("dialog")).getByText(/Backend-Issue #220/)).toBeInTheDocument()
  })

  it("zeigt einen entschiedenen Fall schreibgeschützt — auch ohne bekannten Admin", () => {
    flags = [DECIDED_FLAG]
    render(<AdminOrderDuplicates />)
    openDialog("ORD-1001 → ORD-1002")

    expect(screen.getByText("Bereits entschieden")).toBeInTheDocument()
    expect(screen.getByText("Kundin wollte wirklich zweimal bestellen")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Entscheidung vermerken/ })).toBeNull()
    expect(screen.queryByLabelText("Begründung (optional)")).toBeNull()
  })
})
